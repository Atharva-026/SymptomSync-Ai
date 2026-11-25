require('dotenv').config();
const mongoose = require('mongoose');

async function clearAiAnalysis() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await mongoose.connection
      .collection('medicalrecords')
      .updateMany({}, { $unset: { aiAnalysis: '' } });

    console.log('Cleared AI analysis on', result.modifiedCount, 'records');
  } catch (error) {
    console.error('Failed to clear AI analysis:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

clearAiAnalysis();
