const express = require('express');
const {
  getUserById,
  createSession,
  getSessionsForUser,
  getCharacterOwnedByUser,
  getSessionOwnedByUser,
  updateSessionTitle,
  removeSession,
  getMessagesForSession,
} = require('../../db');
const { ensureSeedCharacters } = require('../helpers/characters');
const { formatCharacterPayload, formatSessionPayload } = require('../helpers/payloads');

const router = express.Router();

router.get('/', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required.' });
  }
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
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

router.post('/', (req, res) => {
  const { userId, title, characterId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
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

router.get('/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required.' });
  }
  const session = getSessionOwnedByUser(sessionId, userId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }
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
});

router.patch('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const { userId, title } = req.body || {};
  if (!userId || typeof title !== 'string') {
    return res.status(400).json({ error: 'userId and title are required.' });
  }
  const updated = updateSessionTitle(sessionId, userId, title);
  if (!updated) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  const session = getSessionOwnedByUser(sessionId, userId);
  let character = null;
  if (session.characterId) {
    const found = getCharacterOwnedByUser(session.characterId, userId);
    character = formatCharacterPayload(found);
  }
  return res.json({ session: formatSessionPayload(session, { character }) });
});

router.delete('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const userId = req.body?.userId || req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }
  const removed = removeSession(sessionId, userId);
  if (!removed) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  return res.status(204).end();
});

module.exports = router;
