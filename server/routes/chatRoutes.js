const express = require('express');
const router = express.Router();
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  getAvailableRecipients,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const chatValidator = require('../validators/chatValidator');

// Private routing for logged-in users
router.get('/recipients', protect, getAvailableRecipients);
router.post('/conversations', protect, validate(chatValidator.getOrCreateConversation), getOrCreateConversation);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id/messages', protect, getMessages);
router.post('/messages', protect, validate(chatValidator.sendMessage), sendMessage);

module.exports = router;
