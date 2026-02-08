const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    
    for (const user of users) {
      if (!user.familyMembers) user.familyMembers = [];
      if (!user.accessToPatients) user.accessToPatients = [];
      if (!user.privacySettings) {
        user.privacySettings = {
          allowFamilyAccess: true,
          requireApprovalForAccess: true
        };
      }
      await user.save();
    }

    console.log(`Migrated ${users.length} users`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();