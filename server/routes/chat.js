const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendMessage,
  listConversations,
  getConversation,
  deleteConversation,
  getContext,
  clearContext
} = require('../controllers/chatController');

router.post('/message', auth, sendMessage);
router.get('/conversations', auth, listConversations);
router.get('/conversations/:id', auth, getConversation);
router.delete('/conversations/:id', auth, deleteConversation);
router.get('/context', auth, getContext);
router.delete('/context', auth, clearContext);

module.exports = router;