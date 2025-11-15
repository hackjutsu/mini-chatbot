const express = require('express');
const { requireUserFromBody } = require('../middleware/requireUser');
const { requireSessionForUser } = require('../middleware/requireSession');
const { streamChatResponse } = require('../services/chatService');

const router = express.Router();

router.post(
  '/',
  requireUserFromBody('userId', 'userId, sessionId, and content are required'),
  requireSessionForUser((req) => req.body?.sessionId, 'userId, sessionId, and content are required'),
  async (req, res) => {
    const { userId, sessionId, content } = req.body || {};

    if (!userId || !sessionId || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'userId, sessionId, and content are required' });
    }

    await streamChatResponse({ req, res, user: req.user, session: req.session, content });
  }
);

module.exports = router;
