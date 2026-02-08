const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: {
    type: String,
    required: false, // CHANGED: Make it optional
    default: 'General health consultation' // ADDED: Default value
  },
  bodyPart: {
    id: String,
    name: String,
    emoji: String
  },
  painLevel: {
    type: Number,
    min: 0,
    max: 10
  },
  duration: {
    amount: Number,
    unit: String
  },
  additionalSymptoms: [{
    type: String
  }],
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
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assessment', assessmentSchema);