// One-off backfill. Run AFTER switching the blockchain layer on:
//
//   cd server
//   node scripts/anchorExistingRecords.js
//
// It queues on-chain registration for every encrypted record that is not on the
// chain yet, and re-queues on-chain access for every accepted family member who
// may view records. Safe to run more than once.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const ChainEvent = require('../models/ChainEvent');
const blockchain = require('../services/blockchainService');
const chain = require('../services/chainAnchors');
const { processPending } = require('../services/chainOutbox');

async function main() {
  blockchain.assertConfigured();
  if (!blockchain.isEnabled()) {
    throw new Error('Set BLOCKCHAIN_ENABLED=true in server/.env first');
  }
  await mongoose.connect(process.env.MONGODB_URI);

  // 1) records that are not registered yet
  const records = await MedicalRecord.find({
    encryptedFileId: { $exists: true },
    'chain.txHash': { $exists: false },
  });
  let queuedRecords = 0;
  for (const record of records) {
    const alreadyQueued = await ChainEvent.exists({
      type: 'register',
      recordRef: record._id,
      status: 'pending',
    });
    if (alreadyQueued) continue;
    await chain.recordUploaded(record);
    queuedRecords += 1;
  }

  // 2) family members who currently have view access
  const patients = await User.find({ 'familyMembers.status': 'accepted' }).select('familyMembers');
  let queuedFamily = 0;
  for (const patient of patients) {
    for (const member of patient.familyMembers) {
      if (member.status === 'accepted' && member.permissions && member.permissions.viewRecords) {
        await chain.familyGranted(patient._id, member.userId);
        queuedFamily += 1;
      }
    }
  }

  console.log(`Queued ${queuedRecords} record registration(s) and ${queuedFamily} family grant(s). Sending...`);
  // The queue sends in order and stops at the first connection problem; try a few times
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await processPending();
    if (!(await ChainEvent.exists({ status: 'pending' }))) break;
  }

  const pending = await ChainEvent.countDocuments({ status: 'pending' });
  const failed = await ChainEvent.countDocuments({ status: 'failed' });
  console.log(`Done. Still pending: ${pending}, failed: ${failed}`);
  if (pending > 0) console.log('Pending events are retried automatically while the server runs.');
  if (failed > 0) console.log('Failed events need a look: db.chainevents.find({status:"failed"}) shows lastError.');
}

main()
  .catch((err) => {
    console.error('❌', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
