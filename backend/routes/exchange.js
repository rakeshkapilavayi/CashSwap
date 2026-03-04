const express = require('express');
const router = express.Router();
const exchangeController = require('../controllers/exchangeController');
const auth = require('../middleware/auth');

// All routes require authentication
router.post('/search', auth, exchangeController.searchUsers);
router.post('/request', auth, exchangeController.createRequest);
router.get('/requests', auth, exchangeController.getMyRequests);
router.post('/match', auth, exchangeController.createMatch);
router.get('/matches', auth, exchangeController.getMyMatches);
router.put('/match/:matchId', auth, exchangeController.updateMatchStatus);

module.exports = router;
