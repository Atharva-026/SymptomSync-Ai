const express = require('express');
const router = express.Router();
const { 
  inviteFamilyMember, 
  respondToInvitation, 
  getFamilyMembers, 
  getAccessiblePatients, 
  getPendingInvitations, 
  updatePermissions, 
  revokeFamilyAccess, 
  setPrimaryCaregiver 
} = require('../controllers/familyAccessController');
const auth = require('../middleware/auth');

// POST Routes
router.post('/invite', auth, inviteFamilyMember);
router.post('/respond', auth, respondToInvitation);
router.post('/primary-caregiver', auth, setPrimaryCaregiver);

// GET Routes
router.get('/members', auth, getFamilyMembers);
router.get('/patients', auth, getAccessiblePatients);
router.get('/invitations', auth, getPendingInvitations);

// PUT & DELETE Routes
router.put('/permissions', auth, updatePermissions);
router.delete('/revoke/:familyMemberId', auth, revokeFamilyAccess);

module.exports = router;