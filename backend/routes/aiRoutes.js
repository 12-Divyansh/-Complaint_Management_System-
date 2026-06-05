const express = require('express');
const router = express.Router();
const { analyzeComplaint, chatWithAI } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze', protect, analyzeComplaint);
router.post('/chat', protect, chatWithAI);

module.exports = router;
