// server/services/chainOutbox.js
//
// Queue + worker for blockchain writes. Controllers call enqueue() and carry
// on; the worker sends events to the chain strictly in order and retries when
// the chain is unreachable.

const ChainEvent = require('../models/ChainEvent');
const MedicalRecord = require('../models/MedicalRecord');
const blockchain = require('./blockchainService');

const RETRY_INTERVAL_MS = 30 * 1000;
let inflight = null; // the run currently in progress, if any

const errorText = (err) => String(err.shortMessage || err.message || err).slice(0, 300);

/** Save an event for the worker, then give the worker a nudge. No-op when the chain is off. */
async function enqueue(type, { recordRef, patientRef, args }) {
  if (!blockchain.isEnabled()) return null;
  const event = await ChainEvent.create({ type, recordRef, patientRef, args });
  processPending().catch((err) => console.error('⛓️ Outbox error:', err.message));
  return event;
}

async function markDone(event, txHash) {
  // Update the record first: if saving the event then fails, the retry of a
  // 'register' just reports RecordExists, which is handled as success below.
  if (event.type === 'register' && event.recordRef) {
    if (txHash) {
      await MedicalRecord.updateOne(
        { _id: event.recordRef },
        { $set: { 'chain.txHash': txHash, 'chain.anchoredAt': new Date() } }
      );
    } else {
      // Already on-chain from an earlier attempt whose receipt we never saw
      await MedicalRecord.updateOne(
        { _id: event.recordRef, 'chain.txHash': { $exists: false } },
        { $set: { 'chain.txHash': 'already-registered', 'chain.anchoredAt': new Date() } }
      );
    }
  }
  event.status = 'done';
  event.txHash = txHash || undefined;
  event.processedAt = new Date();
  event.lastError = undefined;
  await event.save();
}

/**
 * Send every pending event, oldest first. Stops at the first transient error.
 * Only one run happens at a time; callers that arrive mid-run wait for it.
 */
function processPending() {
  if (!blockchain.isEnabled()) return Promise.resolve();
  if (!inflight) {
    inflight = runQueue().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function runQueue() {
  for (;;) {
    const event = await ChainEvent.findOne({ status: 'pending' }).sort({ createdAt: 1, _id: 1 });
    if (!event) break;

    event.attempts += 1;
    try {
      const txHash = await blockchain.send(event.type, event.args);
      await markDone(event, txHash);
    } catch (err) {
      // A retried registration that already went through is a success
      if (event.type === 'register' && err.revert && err.revert.name === 'RecordExists') {
        await markDone(event, null);
        continue;
      }

      event.lastError = errorText(err);

      if (blockchain.isPermanentFailure(err)) {
        event.status = 'failed';
        event.processedAt = new Date();
        await event.save();
        console.error(`⛓️ Event ${event._id} (${event.type}) FAILED permanently: ${event.lastError}`);
        continue; // later events are independent of this one
      }

      await event.save();
      console.warn(`⛓️ Chain unavailable, ${event.type} stays queued (attempt ${event.attempts}): ${event.lastError}`);
      break; // keep order: do not send anything behind this event
    }
  }
}

/** Start the retry loop. Call once after the server starts. */
function startWorker() {
  if (!blockchain.isEnabled()) {
    console.log('⛓️ Blockchain layer is OFF (set BLOCKCHAIN_ENABLED=true to turn it on)');
    return;
  }
  console.log('⛓️ Blockchain layer is ON - contract', process.env.CONTRACT_ADDRESS);
  processPending().catch((err) => console.error('⛓️ Outbox error:', err.message));
  setInterval(() => {
    processPending().catch((err) => console.error('⛓️ Outbox error:', err.message));
  }, RETRY_INTERVAL_MS).unref();
}

module.exports = { enqueue, processPending, startWorker };
