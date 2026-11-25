// Run from the repo root:  node server/scripts/verify-encryption.js
// Behavioural test for the encryption + access-decision layer.
// Real code under test: utils/crypto, utils/fileSignature, services/recordKeys,
// services/recordAccess, services/recordFiles.
// Stubbed: Mongoose models and GridFS (dependencies are not installed here).
const path = require('path');
const crypto = require('crypto');

const SERVER = path.resolve(__dirname, '..');
process.env.MASTER_KEY = crypto.randomBytes(32).toString('hex');

// ---- stubs -----------------------------------------------------------
const users = {};
const upsertCalls = [];
const store = new Map(); // fake GridFS

const stub = (rel, exports) => {
  const file = path.join(SERVER, rel);
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};
stub('models/User.js', {
  findById: (id) => ({ select: async () => users[id] || null }),
});
stub('models/MedicalRecord.js', {
  updateOne: async (filter, update) => {
    upsertCalls.push({ filter, update });
    return { matchedCount: 0 };
  },
});
stub('utils/gridfs.js', {
  saveCiphertext: async (buf) => {
    const id = 'file-' + store.size;
    store.set(id, Buffer.from(buf));
    return id;
  },
  readCiphertext: async (id) => {
    if (!store.has(id)) throw new Error('FileNotFound');
    return Buffer.from(store.get(id));
  },
});

const C = require(path.join(SERVER, 'utils/crypto.js'));
const { matchesDeclaredType } = require(path.join(SERVER, 'utils/fileSignature.js'));
const { resolveRecordAccess } = require(path.join(SERVER, 'services/recordAccess.js'));
const { readDecryptedFile } = require(path.join(SERVER, 'services/recordFiles.js'));
const { wrapFor } = require(path.join(SERVER, 'services/recordKeys.js'));

// ---- tiny harness ----------------------------------------------------
let passed = 0, failed = 0;
const check = (name, ok) => {
  if (ok) { passed++; console.log('  PASS ', name); }
  else { failed++; console.log('  FAIL ', name); }
};
const throws = async (fn) => { try { await fn(); return false; } catch { return true; } };
const section = (t) => console.log('\n' + t);

(async () => {
  // =============== crypto primitives ===============
  section('crypto primitives');
  const plain = crypto.randomBytes(5000);
  const enc = C.encryptBuffer(plain, 'rec-1');
  check('ciphertext differs from plaintext', !enc.ciphertext.equals(plain));
  check('round trip returns original bytes',
    C.decryptBuffer(enc.ciphertext, enc.dek, enc.iv, enc.authTag, 'rec-1').equals(plain));
  const flipped = Buffer.from(enc.ciphertext); flipped[10] ^= 1;
  check('flipped ciphertext bit is rejected',
    await throws(() => C.decryptBuffer(flipped, enc.dek, enc.iv, enc.authTag, 'rec-1')));
  check('wrong record id (AAD) is rejected',
    await throws(() => C.decryptBuffer(enc.ciphertext, enc.dek, enc.iv, enc.authTag, 'rec-2')));
  const enc2 = C.encryptBuffer(plain, 'rec-1');
  check('each file gets a different key and IV', !enc.dek.equals(enc2.dek) && !enc.iv.equals(enc2.iv));

  const wrapped = C.wrapDek(enc.dek, 'userA', 'rec-1');
  check('wrapped key unwraps for the right user+record', C.unwrapDek(wrapped, 'userA', 'rec-1').equals(enc.dek));
  check('wrapped key does NOT unwrap for another user', await throws(() => C.unwrapDek(wrapped, 'userB', 'rec-1')));
  check('wrapped key does NOT unwrap for another record', await throws(() => C.unwrapDek(wrapped, 'userA', 'rec-2')));
  const w = Buffer.from(wrapped.split('.')[1], 'base64'); w[w.length - 1] ^= 1;
  check('tampered wrapped key is rejected',
    await throws(() => C.unwrapDek('v1.' + w.toString('base64'), 'userA', 'rec-1')));
  check('unknown wrapped-key version is rejected', await throws(() => C.unwrapDek('v9.AAAA', 'userA', 'rec-1')));

  process.env.MASTER_KEY = 'not-a-valid-key';
  const cryptoPath = path.join(SERVER, 'utils/crypto.js');
  delete require.cache[cryptoPath];
  const Bad = require(cryptoPath);
  check('startup check rejects a malformed MASTER_KEY', await throws(() => Bad.assertConfigured()));
  process.env.MASTER_KEY = crypto.randomBytes(32).toString('hex');
  delete require.cache[cryptoPath];
  const Fresh = require(cryptoPath);
  check('startup check accepts a valid MASTER_KEY', !(await throws(() => Fresh.assertConfigured())));

  // Remaining tests use the original module instance, whose key is still cached.
  // Re-point the stubs/consumers at it:
  delete require.cache[cryptoPath];
  // (re-require everything so all modules share the same fresh crypto instance)
  for (const rel of ['services/recordKeys.js', 'services/recordAccess.js', 'services/recordFiles.js']) {
    delete require.cache[path.join(SERVER, rel)];
  }
  const K = require(path.join(SERVER, 'utils/crypto.js'));
  const { resolveRecordAccess: resolve } = require(path.join(SERVER, 'services/recordAccess.js'));
  const { readDecryptedFile: readFile } = require(path.join(SERVER, 'services/recordFiles.js'));
  const { wrapFor: wrapForUser } = require(path.join(SERVER, 'services/recordKeys.js'));

  // =============== file signatures ===============
  section('upload file-type check');
  check('real PDF bytes accepted as application/pdf', matchesDeclaredType(Buffer.from('%PDF-1.7 ...'), 'application/pdf'));
  check('real JPEG bytes accepted as image/jpeg', matchesDeclaredType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0]), 'image/jpeg'));
  check('PDF bytes declared as JPEG rejected', !matchesDeclaredType(Buffer.from('%PDF-1.7 ...'), 'image/jpeg'));
  check('Windows executable declared as PDF rejected', !matchesDeclaredType(Buffer.from('MZ\x90\x00\x03\x00\x00\x00'), 'application/pdf'));
  check('HTML declared as PNG rejected', !matchesDeclaredType(Buffer.from('<html><script>'), 'image/png'));
  check('unknown MIME rejected', !matchesDeclaredType(Buffer.from('%PDF-1.7'), 'text/html'));

  // =============== build a realistic record ===============
  const OWNER = 'owner1', FAM = 'fam1', FAM2 = 'fam2', STRANGER = 'x1', DOC = 'doc1';
  const RID = 'rec-100';
  const fileBytes = crypto.randomBytes(2048);
  const e = K.encryptBuffer(fileBytes, RID);
  const fileId = 'file-A';
  store.set(fileId, e.ciphertext);

  const future = new Date(Date.now() + 3600e3), past = new Date(Date.now() - 3600e3);
  const mkRecord = (over = {}) => ({
    _id: RID, patient: OWNER, encryptedFileId: fileId,
    encryption: { iv: e.iv.toString('hex'), authTag: e.authTag.toString('hex') },
    fileHash: e.fileHash,
    ownerWrappedKey: K.wrapDek(e.dek, OWNER, RID),
    keyGrants: [
      { user: FAM, wrappedKey: K.wrapDek(e.dek, FAM, RID) },
      { user: DOC, wrappedKey: K.wrapDek(e.dek, DOC, RID), expiresAt: future },
    ],
    sharedWith: [{ doctor: DOC, accessExpiry: future }],
    isPrivate: false,
    ...over,
  });
  const member = (id, status, perms) => ({ userId: id, status, permissions: perms });
  users[OWNER] = {
    familyMembers: [
      member(FAM, 'accepted', { viewRecords: true }),
      member(FAM2, 'accepted', { viewRecords: false, uploadRecords: true }),
    ],
    privacySettings: { allowFamilyAccess: true },
  };
  const read = async (record, user) => {
    const a = await resolve(record, user);
    if (!a.allowed) return { allowed: false };
    return { ...a, bytes: await readFile(record, a.wrappedKey, a.keyUserId) };
  };

  // =============== access decisions ===============
  section('who can read the record');
  let r = await read(mkRecord(), { id: OWNER, role: 'patient' });
  check('owner can read and gets the exact original bytes', r.allowed && r.via === 'owner' && r.bytes.equals(fileBytes));

  r = await read(mkRecord(), { id: FAM, role: 'patient' });
  check('family member with viewRecords can read (original bytes)', r.allowed && r.via === 'family' && r.bytes.equals(fileBytes));

  r = await read(mkRecord(), { id: STRANGER, role: 'patient' });
  check('stranger is denied', !r.allowed);

  r = await read(mkRecord(), { id: FAM2, role: 'patient' });
  check('family member WITHOUT viewRecords is denied (upload-only)', !r.allowed);

  users[OWNER].familyMembers[0].status = 'revoked';
  r = await read(mkRecord(), { id: FAM, role: 'patient' });
  check('revoked family member is denied even though a grant still exists', !r.allowed);
  users[OWNER].familyMembers[0].status = 'accepted';

  users[OWNER].familyMembers[0].status = 'pending';
  r = await read(mkRecord(), { id: FAM, role: 'patient' });
  check('pending (not yet accepted) family member is denied', !r.allowed);
  users[OWNER].familyMembers[0].status = 'accepted';

  users[OWNER].privacySettings.allowFamilyAccess = false;
  r = await read(mkRecord(), { id: FAM, role: 'patient' });
  check('family denied when the patient disabled family access', !r.allowed);
  users[OWNER].privacySettings.allowFamilyAccess = true;

  r = await read(mkRecord({ isPrivate: true }), { id: FAM, role: 'patient' });
  check('family denied on a record marked private', !r.allowed);
  r = await read(mkRecord({ isPrivate: true }), { id: OWNER, role: 'patient' });
  check('owner can still read their private record', r.allowed);

  upsertCalls.length = 0;
  r = await read(mkRecord({ keyGrants: [] }), { id: FAM, role: 'patient' });
  check('family with valid permission but missing grant: allowed (self-heal)', r.allowed && r.bytes.equals(fileBytes));
  check('self-heal persisted a new grant for that user', upsertCalls.length > 0);

  r = await read(mkRecord(), { id: DOC, role: 'doctor' });
  check('doctor with grant + unexpired share can read', r.allowed && r.via === 'doctor' && r.bytes.equals(fileBytes));
  r = await read(mkRecord({ sharedWith: [{ doctor: DOC, accessExpiry: past }] }), { id: DOC, role: 'doctor' });
  check('doctor denied once the share has expired', !r.allowed);
  r = await read(mkRecord({ keyGrants: [{ user: DOC, wrappedKey: K.wrapDek(e.dek, DOC, RID), expiresAt: past }] }), { id: DOC, role: 'doctor' });
  check('doctor denied once the key grant has expired', !r.allowed);
  r = await read(mkRecord({ keyGrants: [] }), { id: DOC, role: 'doctor' });
  check('doctor with a share entry but no key grant is denied', !r.allowed);
  r = await read(mkRecord(), { id: DOC, role: 'patient' });
  check('non-doctor role cannot use a doctor share', !r.allowed);

  // =============== key isolation ===============
  section('keys cannot be borrowed');
  const rec = mkRecord();
  check("another user can't unwrap a family member's stored key",
    await throws(() => readFile(rec, rec.keyGrants[0].wrappedKey, STRANGER)));
  check("a key from one record doesn't work on another record",
    await throws(() => readFile({ ...rec, _id: 'rec-OTHER' }, rec.ownerWrappedKey, OWNER)));

  // =============== tamper detection ===============
  section('tamper detection');
  const bad = Buffer.from(e.ciphertext); bad[5] ^= 0xff;
  store.set('file-bad', bad);
  let code = null;
  try { await readFile(mkRecord({ encryptedFileId: 'file-bad' }), mkRecord().ownerWrappedKey, OWNER); } catch (err) { code = err.code; }
  check('modified ciphertext is caught by the hash check (INTEGRITY)', code === 'INTEGRITY');

  // attacker also rewrites the stored hash to match -> GCM must still catch it
  store.set('file-bad2', bad);
  code = null;
  try {
    await readFile(mkRecord({ encryptedFileId: 'file-bad2', fileHash: K.sha256(bad) }), mkRecord().ownerWrappedKey, OWNER);
  } catch (err) { code = err.code; }
  check('modified ciphertext + forged hash is still caught by AES-GCM (INTEGRITY)', code === 'INTEGRITY');

  code = null;
  try { await readFile(mkRecord({ encryptedFileId: undefined }), mkRecord().ownerWrappedKey, OWNER); } catch (err) { code = err.code; }
  check('pre-encryption legacy record reports LEGACY, not a crash', code === 'LEGACY');

  // =============== at-rest check ===============
  section('what is stored in the database');
  check('stored bytes contain no plaintext', store.get(fileId).indexOf(fileBytes.subarray(100, 140)) === -1);
  const pdfPlain = Buffer.from('%PDF-1.4 PATIENT: Asha Rao DIAGNOSIS: diabetes HbA1c 9.1');
  const pe = K.encryptBuffer(pdfPlain, 'rec-pdf');
  check('PDF text (name/diagnosis) is not visible in the ciphertext',
    !pe.ciphertext.toString('latin1').includes('Asha') && !pe.ciphertext.toString('latin1').includes('diabetes'));

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((err) => { console.error('TEST CRASHED:', err); process.exit(2); });
