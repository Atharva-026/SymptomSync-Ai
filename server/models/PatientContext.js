const mongoose = require('mongoose');

const patientContextSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  conditions: [String],
  medications: [String],
  allergies: [String]
}, { timestamps: true });

module.exports = mongoose.model('PatientContext', patientContextSchema);