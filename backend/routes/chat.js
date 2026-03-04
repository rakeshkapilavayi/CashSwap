const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// All routes require authentication
router.post('/conversation', auth, chatController.getOrCreateConversation);
router.get('/conversations', auth, chatController.getMyConversations);
router.get('/messages/:conversationId', auth, chatController.getMessages);
router.post('/message', auth, chatController.sendMessage);
router.put('/read/:conversationId', auth, chatController.markAsRead);

module.exports = router;