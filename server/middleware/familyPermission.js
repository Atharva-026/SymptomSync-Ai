// server/middleware/familyPermission.js

const User = require('../models/User');

/**
 * Middleware to check if user has permission to access patient data
 * Usage: checkFamilyPermission('viewRecords')
 */
const checkFamilyPermission = (permissionType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id; // Current logged-in user
      const patientId = req.params.patientId || req.body.patientId || req.query.patientId;

      // If user is accessing their own data, allow
      if (userId === patientId) {
        req.isOwner = true;
        return next();
      }

      // Check if user is a doctor (doctors have access through appointments)
      const currentUser = await User.findById(userId);
      if (currentUser.role === 'doctor') {
        // You can add additional doctor permission checks here
        return next();
      }

      // Check family member permissions
      const patient = await User.findById(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const familyMemberEntry = patient.familyMembers.find(
        fm => fm.userId.toString() === userId && fm.status === 'accepted'
      );

      if (!familyMemberEntry) {
        return res.status(403).json({ 
          message: 'You do not have access to this patient\'s data' 
        });
      }

      // Check specific permission
      if (!familyMemberEntry.permissions[permissionType]) {
        return res.status(403).json({ 
          message: `You do not have permission to ${permissionType.replace(/([A-Z])/g, ' $1').toLowerCase()}` 
        });
      }

      // Add patient and family member info to request
      req.patient = patient;
      req.familyMember = familyMemberEntry;
      req.isOwner = false;

      next();

    } catch (error) {
      console.error('Error checking family permission:', error);
      res.status(500).json({ message: 'Permission check failed', error: error.message });
    }
  };
};

/**
 * Middleware to check if user can manage (create/update/delete) patient data
 * This is more restrictive than just viewing
 */
const checkManagePermission = (permissionType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const patientId = req.params.patientId || req.body.patientId || req.query.patientId;

      // If user is accessing their own data, allow
      if (userId === patientId) {
        req.isOwner = true;
        return next();
      }

      // Check family member permissions
      const patient = await User.findById(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const familyMemberEntry = patient.familyMembers.find(
        fm => fm.userId.toString() === userId && fm.status === 'accepted'
      );

      if (!familyMemberEntry) {
        return res.status(403).json({ 
          message: 'You do not have access to manage this patient\'s data' 
        });
      }

      // For management operations, require explicit permission
      if (!familyMemberEntry.permissions[permissionType]) {
        return res.status(403).json({ 
          message: `You do not have permission to manage ${permissionType.replace(/([A-Z])/g, ' $1').toLowerCase()}` 
        });
      }

      req.patient = patient;
      req.familyMember = familyMemberEntry;
      req.isOwner = false;

      next();

    } catch (error) {
      console.error('Error checking manage permission:', error);
      res.status(500).json({ message: 'Permission check failed', error: error.message });
    }
  };
};

/**
 * Middleware to get patient ID from family member context
 * This allows family members to act on behalf of patients
 */
const resolvePatientId = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const providedPatientId = req.params.patientId || req.body.patientId || req.query.patientId;

    // If patient ID is provided, use it
    if (providedPatientId) {
      req.effectivePatientId = providedPatientId;
    } else {
      // Otherwise, use the current user's ID (they're acting for themselves)
      req.effectivePatientId = userId;
    }

    next();

  } catch (error) {
    console.error('Error resolving patient ID:', error);
    res.status(500).json({ message: 'Failed to resolve patient ID', error: error.message });
  }
};

module.exports = {
  checkFamilyPermission,
  checkManagePermission,
  resolvePatientId
};