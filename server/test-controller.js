// server/test-controller.js
// Run this to test if controller loads correctly

const familyAccessController = require('./controllers/familyAccessController');

console.log('Testing familyAccessController...\n');

console.log('inviteFamilyMember:', typeof familyAccessController.inviteFamilyMember);
console.log('respondToInvitation:', typeof familyAccessController.respondToInvitation);
console.log('getFamilyMembers:', typeof familyAccessController.getFamilyMembers);
console.log('getAccessiblePatients:', typeof familyAccessController.getAccessiblePatients);
console.log('getPendingInvitations:', typeof familyAccessController.getPendingInvitations);
console.log('updatePermissions:', typeof familyAccessController.updatePermissions);
console.log('revokeFamilyAccess:', typeof familyAccessController.revokeFamilyAccess);
console.log('setPrimaryCaregiver:', typeof familyAccessController.setPrimaryCaregiver);

console.log('\nAll should be "function". If any is "undefined", that function is not exported correctly.');