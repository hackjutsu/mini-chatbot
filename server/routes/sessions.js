const express = require('express');
const {
  requireUserFromQuery,
  requireUserFromBody,
  requireUserFromBodyOrQuery,
} = require('../middleware/requireUser');
const { requireSessionForUser } = require('../middleware/requireSession');
const sessionService = require('../services/sessionService');

const router = express.Router();

router.get('/', requireUserFromQuery(), (req, res) => {
  const userId = req.user.id;
  const sessions = sessionService.listForUser(userId);
  return res.json({ sessions });
});

router.post('/', requireUserFromBody(), (req, res) => {
  const { title, characterId } = req.body || {};
  const userId = req.user.id;
  try {
    const session = sessionService.createForUser(userId, { title, characterId });
    return res.status(201).json({ session });
  } catch (error) {
    if (error.code === sessionService.CHARACTER_NOT_FOUND) {
      return res.status(400).json({ error: 'Character not found for user.' });
    }
    console.error('Failed to create session:', error);
    return res.status(500).json({ error: 'Unable to create session.' });
  }
});

router.get(
  '/:sessionId/messages',
  requireUserFromQuery(),
  requireSessionForUser((req) => req.params.sessionId),
  (req, res) => {
    const userId = req.user.id;
    const transcript = sessionService.getTranscriptForSession(req.session, userId);
    return res.json(transcript);
  }
);

router.patch(
  '/:sessionId',
  requireUserFromBody(),
  requireSessionForUser((req) => req.params.sessionId),
  (req, res) => {
    const { title } = req.body || {};
    if (typeof title !== 'string') {
      return res.status(400).json({ error: 'userId and title are required.' });
    }
    const userId = req.user.id;
    const updated = sessionService.renameSession(req.session.id, userId, title);
    if (!updated) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    return res.json({ session: updated });
  }
);

router.delete(
  '/:sessionId',
  requireUserFromBodyOrQuery(),
  requireSessionForUser((req) => req.params.sessionId),
  (req, res) => {
    const userId = req.user.id;
    const removed = sessionService.deleteSessionForUser(req.session.id, userId);
    if (!removed) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    return res.status(204).end();
  }
);

module.exports = router;
