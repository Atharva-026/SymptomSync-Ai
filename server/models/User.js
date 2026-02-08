// server/models/User.js

const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relationship: {
    type: String,
    enum: ['spouse', 'child', 'parent', 'sibling', 'guardian', 'caregiver', 'other'],
    required: true
  },
  permissions: {
    viewRecords: { type: Boolean, default: false },
    manageAppointments: { type: Boolean, default: false },
    viewAssessments: { type: Boolean, default: false },
    manageMedications: { type: Boolean, default: false },
    uploadRecords: { type: Boolean, default: false },
    emergencyContact: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'revoked'],
    default: 'pending'
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: Date,
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  
  // Doctor-specific fields
  specialty: {
    type: String
  },
  licenseNumber: {
    type: String
  },
  experience: {
    type: Number
  },
  
  // Family Access Fields
  familyMembers: [familyMemberSchema],
  
  // Patients this user has access to (as a family member)
  accessToPatients: [{
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relationship: String,
    permissions: {
      viewRecords: Boolean,
      manageAppointments: Boolean,
      viewAssessments: Boolean,
      manageMedications: Boolean,
      uploadRecords: Boolean,
      emergencyContact: Boolean
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'revoked'],
      default: 'pending'
    },
    grantedAt: Date
  }],
  
  // Primary caregiver (for elderly/dependent patients)
  primaryCaregiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Privacy settings
  privacySettings: {
    allowFamilyAccess: {
      type: Boolean,
      default: true
    },
    requireApprovalForAccess: {
      type: Boolean,
      default: true
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ 'familyMembers.userId': 1 });
userSchema.index({ 'accessToPatients.patientId': 1 });


const bcrypt = require('bcryptjs');

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
module.exports = mongoose.model('User', userSchema);