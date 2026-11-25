const mongoose = require('mongoose');

// Append-only audit trail of who touched which record. Later phases anchor
// these events on the blockchain; for now it is the platform's own log.
const recordAccessLogSchema = new mongoose.Schema(
  {
    record: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord', required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // empty for anonymous QR viewers
    via: {
      type: String,
      enum: ['owner', 'family', 'doctor', 'share-link'],
      required: true,
    },
    action: { type: String, required: true }, // upload | view | download | analyze | share-link-create | ...
    ip: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

recordAccessLogSchema.index({ record: 1, createdAt: -1 });

module.exports = mongoose.model('RecordAccessLog', recordAccessLogSchema);
