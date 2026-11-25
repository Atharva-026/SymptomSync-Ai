const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: {
    type: String,
    default: 'General health consultation'
  },
  // Legacy fields from the old form-based assessment (kept so old data still loads)
  bodyPart: { id: String, name: String, emoji: String },
  painLevel: { type: Number, min: 0, max: 10 },
  duration: { amount: Number, unit: String },
  additionalSymptoms: [{ type: String }],
  riskLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  // The chat this assessment came from
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  // Doctor-facing summary of the chat. Only set when the patient consents, and
  // always copied server-side from the saved conversation, never from the request.
  brief: { type: mongoose.Schema.Types.Mixed },
  briefSharedAt: { type: Date },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assessment', assessmentSchema);