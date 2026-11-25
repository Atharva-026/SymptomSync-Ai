const mongoose = require('mongoose');

// One entry per person (family member / doctor) allowed to decrypt this record.
// `wrappedKey` is the file key encrypted for that person - never the key itself.
const keyGrantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    wrappedKey: { type: String, required: true },
    grantedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }, // empty = no expiry
  },
  { _id: false }
);

// Short-lived QR / link access. Only a hash of the token is stored.
const shareLinkSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    accessCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date },
  },
  { _id: false }
);

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Who actually uploaded it (the patient, or a family member with uploadRecords)
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    recordType: {
      type: String,
      enum: ['lab_report', 'prescription', 'scan', 'xray', 'other'],
      required: true,
    },

    // LEGACY: path of an unencrypted file on disk. New records never set this.
    fileUrl: {
      type: String,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String, // application/pdf, image/jpeg, etc.
      required: true,
    },
    fileSize: {
      type: Number, // plaintext size in bytes
    },

    // ---- Encrypted storage (never returned by the API) ----
    encryptedFileId: { type: mongoose.Schema.Types.ObjectId }, // GridFS file id of the ciphertext
    encryption: {
      type: new mongoose.Schema(
        {
          algo: { type: String, default: 'aes-256-gcm' },
          iv: String,
          authTag: String,
        },
        { _id: false }
      ),
      select: false,
    },
    fileHash: { type: String }, // SHA-256 of the ciphertext (tamper check / future on-chain anchor)
    ownerWrappedKey: { type: String, select: false },
    keyGrants: { type: [keyGrantSchema], select: false },
    shareLinks: { type: [shareLinkSchema], select: false },

    uploadDate: {
      type: Date,
      default: Date.now,
    },
    recordDate: {
      type: Date, // Actual date of the medical record
      default: Date.now,
    },

    // Sharing settings (doctors)
    sharedWith: [
      {
        doctor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
        accessExpiry: {
          type: Date,
        },
        accessCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    // Metadata
    tags: [String],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Defence in depth: key material must never leave the server, even if a
      // query accidentally selects it.
      transform: (doc, ret) => {
        delete ret.ownerWrappedKey;
        delete ret.keyGrants;
        delete ret.encryption;
        delete ret.shareLinks;
        delete ret.encryptedFileId;
        return ret;
      },
    },
  }
);

// Index for faster queries
medicalRecordSchema.index({ patient: 1, uploadDate: -1 });
medicalRecordSchema.index({ 'shareLinks.tokenHash': 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
