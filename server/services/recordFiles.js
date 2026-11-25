// server/services/recordFiles.js
//
// Read ciphertext from Atlas, verify it, and decrypt it in memory.
// Plaintext is never written to disk.

const { readCiphertext } = require('../utils/gridfs');
const { sha256, decryptBuffer, unwrapDek } = require('../utils/crypto');

class RecordFileError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // 'LEGACY' | 'INTEGRITY'
  }
}

/**
 * @param record      MedicalRecord loaded with '+encryption'
 * @param wrappedKey  the file key wrapped for `keyUserId`
 * @param keyUserId   whose key-encryption key unwraps it
 * @returns {Promise<Buffer>} plaintext file
 */
async function readDecryptedFile(record, wrappedKey, keyUserId) {
  if (!record.encryptedFileId || !record.encryption) {
    throw new RecordFileError(
      'LEGACY',
      'This record was stored before encryption was enabled. Please upload it again.'
    );
  }

  const ciphertext = await readCiphertext(record.encryptedFileId);

  if (sha256(ciphertext) !== record.fileHash) {
    throw new RecordFileError('INTEGRITY', 'Integrity check failed: stored file was modified');
  }

  const dek = unwrapDek(wrappedKey, keyUserId, record._id);
  try {
    return decryptBuffer(
      ciphertext,
      dek,
      Buffer.from(record.encryption.iv, 'hex'),
      Buffer.from(record.encryption.authTag, 'hex'),
      record._id.toString()
    );
  } catch (err) {
    throw new RecordFileError('INTEGRITY', 'Integrity check failed: file could not be authenticated');
  } finally {
    dek.fill(0);
  }
}

module.exports = { readDecryptedFile, RecordFileError };
