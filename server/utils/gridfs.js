// server/utils/gridfs.js
//
// Stores ciphertext in MongoDB Atlas using GridFS (built into the MongoDB
// driver that Mongoose already ships with - no extra dependency).

const mongoose = require('mongoose');

const bucket = () =>
  new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'medicalRecords',
  });

/** Save a buffer and resolve with the new GridFS file id. */
const saveCiphertext = (buffer, filename) =>
  new Promise((resolve, reject) => {
    const upload = bucket().openUploadStream(filename);
    upload.on('error', reject);
    upload.on('finish', () => resolve(upload.id));
    upload.end(buffer);
  });

/** Read a whole stored file back into memory (files are capped at 10 MB). */
const readCiphertext = async (id) => {
  const chunks = [];
  for await (const chunk of bucket().openDownloadStream(id)) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const deleteCiphertext = (id) => bucket().delete(id);

module.exports = { saveCiphertext, readCiphertext, deleteCiphertext };
