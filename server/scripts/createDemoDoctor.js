// File: server/scripts/createDemoDoctor.js
// Run: node server/scripts/createDemoDoctor.js

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createDemoDoctor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check existing doctors
    const existingDoctors = await User.find({ userType: 'doctor' });
    console.log(`\n📊 Found ${existingDoctors.length} doctors in database:`);
    existingDoctors.forEach(doc => {
      console.log(`   - ${doc.name} (${doc.email}) - ${doc.specialty || 'No specialty'}`);
    });

    // Create demo doctor if none exist
    if (existingDoctors.length === 0) {
      console.log('\n🏥 Creating demo doctor...');
      
      const demoDoctor = new User({
        name: 'Dr. Sarah Johnson',
        email: 'demo.doctor@symptomsync.com',
        password: 'Doctor123!',
        userType: 'doctor',
        specialty: 'General Practice',
        experience: 10,  // ✅ Number, not string
        rating: 4.8,
        consultationFee: 50,
        available: true
      });

      await demoDoctor.save();
      console.log('✅ Demo doctor created!');
      console.log(`   Name: Dr. Sarah Johnson`);
      console.log(`   Email: demo.doctor@symptomsync.com`);
      console.log(`   Password: Doctor123!`);
      console.log(`   Specialty: General Practice`);
    } else {
      console.log('\n✅ Doctors already exist, no need to create demo');
    }

    // Also create a few more doctors for variety
    const doctorCount = await User.countDocuments({ userType: 'doctor' });
    
    if (doctorCount < 3) {
      console.log('\n👥 Creating additional demo doctors...');
      
      const additionalDoctors = [
        {
          name: 'Dr. Michael Chen',
          email: 'michael.chen@symptomsync.com',
          password: 'Doctor123!',
          userType: 'doctor',
          specialty: 'Internal Medicine',
          experience: 15,
          rating: 4.9,
          consultationFee: 75,
          available: true
        },
        {
          name: 'Dr. Emily Rodriguez',
          email: 'emily.rodriguez@symptomsync.com',
          password: 'Doctor123!',
          userType: 'doctor',
          specialty: 'Family Medicine',
          experience: 8,
          rating: 4.7,
          consultationFee: 60,
          available: true
        }
      ];

      for (const docData of additionalDoctors) {
        const exists = await User.findOne({ email: docData.email });
        if (!exists) {
          await User.create(docData);
          console.log(`   ✅ Created: ${docData.name}`);
        }
      }
    }

    // Show final count
    const finalCount = await User.countDocuments({ userType: 'doctor' });
    console.log(`\n✨ Total doctors in database: ${finalCount}`);
    console.log('🎬 Ready for demo!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createDemoDoctor();