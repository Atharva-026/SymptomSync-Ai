// server/test-routes.js

console.log('Testing route file loading...\n');

try {
  console.log('1. Loading auth middleware...');
  const auth = require('./middleware/auth');
  console.log('   Auth type:', typeof auth);
  
  console.log('\n2. Loading controller...');
  const controller = require('./controllers/familyAccessController');
  console.log('   Controller.inviteFamilyMember:', typeof controller.inviteFamilyMember);
  
  console.log('\n3. Loading routes file...');
  const routes = require('./routes/familyAccess');
  console.log('   Routes loaded successfully!');
  console.log('   Routes type:', typeof routes);
  
  console.log('\n✅ All imports successful!');
  
} catch (error) {
  console.error('\n❌ Error loading files:');
  console.error(error.message);
  console.error('\nFull error:');
  console.error(error);
}