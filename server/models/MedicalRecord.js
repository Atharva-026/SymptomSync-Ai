const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  recordType: {
    type: String,
    enum: ['lab_report', 'prescription', 'scan', 'xray', 'other'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String, // application/pdf, image/jpeg, etc.
    required: true
  },
  fileSize: {
    type: Number // in bytes
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  recordDate: {
    type: Date, // Actual date of the medical record
    default: Date.now
  },
  // QR Code
  qrCode: {
    type: String, // Base64 encoded QR code image
  },
  shareToken: {
    type: String, // Unique token for sharing via QR
    unique: true,
    required: true
  },
  // Sharing settings
  sharedWith: [{
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    accessExpiry: {
      type: Date
    },
    accessCount: {
      type: Number,
      default: 0
    }
  }],
  // AI Analysis
  aiAnalysis: {
    summary: String,
    keyFindings: [String],
    abnormalValues: [String],
    recommendations: [String],
    analyzedAt: Date,
    model: String // which AI model was used
  },
  // Metadata
  tags: [String],
  isPrivate: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
medicalRecordSchema.index({ patient: 1, uploadDate: -1 });
medicalRecordSchema.index({ shareToken: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);