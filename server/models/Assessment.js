const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  bodyPart: {
    id: String,
    name: String,
    emoji: String
  },
  painLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  duration: {
    amount: Number,
    unit: String
  },
  additionalSymptoms: [{
    type: String
  }],
  followUpAnswers: {
    type: Map,
    of: String
  },
  riskLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  recommendation: {
    severity: String,
    title: String,
    description: String,
    actions: [String],
    tips: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assessment', assessmentSchema);