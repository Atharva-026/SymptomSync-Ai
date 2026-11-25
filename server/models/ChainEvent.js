const mongoose = require('mongoose');

// Outbox of blockchain writes. Every grant / revoke / registration is saved
// here FIRST and sent to the chain by a worker, in order. That gives us:
//   - retries when the chain is down (nothing is lost),
//   - strict ordering (a revoke can never overtake the grant before it),
//   - a record of what is not yet confirmed on-chain.
const chainEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['register', 'grantRecord', 'revokeRecord', 'grantPatient', 'revokePatient', 'logAccess'],
    },
    // Mongo ids this event is about (used to find "unsynced" records quickly)
    recordRef: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' },
    patientRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Already-hashed bytes32 values + expiry. No readable personal data.
    args: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['pending', 'done', 'failed'],
      default: 'pending',
    },
    attempts: { type: Number, default: 0 },
    lastError: String,
    txHash: String,
    processedAt: Date,
  },
  { timestamps: true }
);

chainEventSchema.index({ status: 1, createdAt: 1 });
chainEventSchema.index({ recordRef: 1, status: 1 });
chainEventSchema.index({ patientRef: 1, status: 1 });

module.exports = mongoose.model('ChainEvent', chainEventSchema);
