const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // The share-link design changed (shareToken -> hashed shareLinks[]), so the
    // old unique shareToken index must be dropped or new records would collide.
    try {
      await require('../models/MedicalRecord').syncIndexes();
    } catch (indexError) {
      console.warn(`⚠️ MedicalRecord index sync failed: ${indexError.message}`);
    }
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
