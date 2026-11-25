// server/utils/crypto.js
//
// Envelope encryption for medical files.
//
//   file  --AES-256-GCM(DEK)-->  ciphertext            (stored in MongoDB GridFS)
//   DEK   --AES-256-GCM(KEK_user)-->  wrapped key      (one per person allowed to read it)
//   KEK_user = HKDF(MASTER_KEY, "kek:<userId>")
//
// Every file gets its own random DEK. Wrapped keys are bound (via GCM AAD) to
// the user AND the record they belong to, so a wrapped key copied from one
// record/user to another will not decrypt.

const crypto = require('crypto');

const KEY_VERSION = 'v1';
const KEK_SALT = Buffer.from('symptomsync/kek/v1');

let cachedMasterKey = null;

function masterKey() {
  if (cachedMasterKey) return cachedMasterKey;
  const hex = process.env.MASTER_KEY || '';
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      'MASTER_KEY must be set to 64 hex characters (32 bytes). Generate one with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  cachedMasterKey = Buffer.from(hex, 'hex');
  return cachedMasterKey;
}

const assertConfigured = () => {
  masterKey();
};

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

/**
 * Encrypt a file buffer with a fresh random key.
 * @param {Buffer} plain
 * @param {string} aad  extra authenticated data (we pass the record id)
 */
function encryptBuffer(plain, aad) {
  const dek = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
  if (aad) cipher.setAAD(Buffer.from(String(aad)));
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return {
    ciphertext,
    dek,
    iv,
    authTag: cipher.getAuthTag(),
    fileHash: sha256(ciphertext),
  };
}

/** Decrypt a file buffer. Throws if the data or tag was tampered with. */
function decryptBuffer(ciphertext, dek, iv, authTag, aad) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
  if (aad) decipher.setAAD(Buffer.from(String(aad)));
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function deriveKek(userId) {
  return Buffer.from(
    crypto.hkdfSync('sha256', masterKey(), KEK_SALT, `kek:${userId}`, 32)
  );
}

/** Wrap a file key so that `userId` can use it on `recordId`. Returns "v1.<base64>". */
function wrapDek(dek, userId, recordId) {
  const kek = deriveKek(String(userId));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);
  cipher.setAAD(Buffer.from(`${userId}:${recordId}`));
  const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
  const tag = cipher.getAuthTag();
  kek.fill(0);
  return `${KEY_VERSION}.${Buffer.concat([iv, tag, encrypted]).toString('base64')}`;
}

/** Reverse of wrapDek. Throws if the key belongs to another user/record or was altered. */
function unwrapDek(wrapped, userId, recordId) {
  const [version, b64] = String(wrapped).split('.');
  if (version !== KEY_VERSION || !b64) {
    throw new Error('Unsupported wrapped key format');
  }
  const raw = Buffer.from(b64, 'base64');
  const kek = deriveKek(String(userId));
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', kek, raw.subarray(0, 12));
    decipher.setAAD(Buffer.from(`${userId}:${recordId}`));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]);
  } finally {
    kek.fill(0);
  }
}

module.exports = {
  assertConfigured,
  sha256,
  encryptBuffer,
  decryptBuffer,
  wrapDek,
  unwrapDek,
};
