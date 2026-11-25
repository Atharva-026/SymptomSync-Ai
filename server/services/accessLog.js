// server/services/accessLog.js
const RecordAccessLog = require('../models/RecordAccessLog');

/** Best-effort audit write: a logging failure must never break the request. */
async function logAccess(recordId, { actor, via, action, req, meta }) {
  try {
    await RecordAccessLog.create({
      record: recordId,
      actor: actor || undefined,
      via,
      action,
      ip: req ? req.ip : undefined,
      meta,
    });
  } catch (err) {
    console.error('Access log write failed:', err.message);
  }
}

module.exports = { logAccess };
