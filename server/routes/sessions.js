const express = require('express');
const {
  createSession,
  getSessionsForUser,
  getCharacterOwnedByUser,
  updateSessionTitle,
  removeSession,
  getMessagesForSession,
} = require('../../db');
const { ensureSeedCharacters } = require('../helpers/characters');
const { formatCharacterPayload, formatSessionPayload } = require('../helpers/payloads');
const {
  requireUserFromQuery,
  requireUserFromBody,
  requireUserFromBodyOrQuery,
} = require('../middleware/requireUser');
const { requireSessionForUser } = require('../middleware/requireSession');

const router = express.Router();

router.get('/', requireUserFromQuery(), (req, res) => {
  const userId = req.user.id;
  const characters = ensureSeedCharacters(userId);
  const characterMap = new Map(
    characters.map((character) => [character.id, formatCharacterPayload(character)])
  );
  const sessions = getSessionsForUser(userId).map((session) => {
    const character = session.characterId ? characterMap.get(session.characterId) || null : null;
    return formatSessionPayload(session, { character });
  });
  return res.json({ sessions });
});

router.post('/', requireUserFromBody(), (req, res) => {
  const { title, characterId } = req.body || {};
  const userId = req.user.id;
  let character = null;
  if (characterId) {
    character = getCharacterOwnedByUser(characterId, userId);
    if (!character) {
      return res.status(400).json({ error: 'Character not found for user.' });
    }
  }
  try {
    const session = createSession(userId, title, character ? character.id : null);
    return res.status(201).json({
      session: formatSessionPayload(
        { ...session, characterId: character ? character.id : null },
        { messageCount: 0, character: formatCharacterPayload(character) }
      ),
    });
  } catch (error) {
    console.error('Failed to create session:', error);
    return res.status(500).json({ error: 'Unable to create session.' });
  }
});

router.get(
  '/:sessionId/messages',
  requireUserFromQuery(),
  requireSessionForUser((req) => req.params.sessionId),
  (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const session = req.session;
    let character = null;
    if (session.characterId) {
      const found = getCharacterOwnedByUser(session.characterId, userId);
      character = formatCharacterPayload(found);
    }
    const messages = getMessagesForSession(sessionId).map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    }));
    return res.json({
      session: formatSessionPayload(session, { messageCount: messages.length, character }),
      messages,
    });
  }
);

router.patch(
  '/:sessionId',
  requireUserFromBody(),
  requireSessionForUser((req) => req.params.sessionId),
  (req, res) => {
    const { sessionId } = req.params;
    const { userId, title } = req.body || {};
    if (!userId || typeof title !== 'string') {
      return res.status(400).json({ error: 'userId and title are required.' });
    }
    const finalUserId = req.user.id;
    const updated = updateSessionTitle(sessionId, finalUserId, title);
    if (!updated) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    const session = req.session;
    let character = null;
    if (session.characterId) {
      const found = getCharacterOwnedByUser(session.characterId, finalUserId);
      character = formatCharacterPayload(found);
    }
    return res.json({ session: formatSessionPayload(session, { character }) });
  }
);

router.delete(
  '/:sessionId',
  requireUserFromBodyOrQuery(),
  requireSessionForUser((req) => req.params.sessionId),
  (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const removed = removeSession(sessionId, userId);
    if (!removed) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    return res.status(204).end();
  }
);

module.exports = router;
