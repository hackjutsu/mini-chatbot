const {
  createSession,
  getSessionsForUser,
  getCharacterOwnedByUser,
  getCharactersForUser,
  getMessagesForSession,
  updateSessionTitle,
  removeSession,
  getSessionOwnedByUser,
} = require('../../db');
const { formatCharacterPayload, formatSessionPayload } = require('../helpers/payloads');

const CHARACTER_NOT_FOUND = 'CHARACTER_NOT_FOUND';

const buildCharacterMap = (userId) => {
  const characters = getCharactersForUser(userId);
  return new Map(characters.map((character) => [character.id, formatCharacterPayload(character)]));
};

const listForUser = (userId) => {
  const characterMap = buildCharacterMap(userId);
  return getSessionsForUser(userId).map((session) => {
    const character = session.characterId ? characterMap.get(session.characterId) || null : null;
    return formatSessionPayload(session, { character });
  });
};

const createForUser = (userId, { title, characterId }) => {
  let characterView = null;
  if (characterId) {
    const owned = getCharacterOwnedByUser(characterId, userId);
    if (!owned) {
      const error = new Error('Character not found for user.');
      error.code = CHARACTER_NOT_FOUND;
      throw error;
    }
    characterView = formatCharacterPayload(owned);
  }
  const session = createSession(userId, title, characterId || null);
  return formatSessionPayload(
    { ...session, characterId: characterId || null },
    { messageCount: 0, character: characterView }
  );
};

const getTranscriptForSession = (session, userId) => {
  let character = null;
  if (session.characterId) {
    const owned = getCharacterOwnedByUser(session.characterId, userId);
    character = formatCharacterPayload(owned);
  }
  const messages = getMessagesForSession(session.id).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  }));
  return {
    session: formatSessionPayload(session, { messageCount: messages.length, character }),
    messages,
  };
};

const renameSession = (sessionId, userId, title) => {
  const updated = updateSessionTitle(sessionId, userId, title);
  if (!updated) {
    return null;
  }
  const session = getSessionOwnedByUser(sessionId, userId);
  if (!session) {
    return null;
  }
  let character = null;
  if (session.characterId) {
    const owned = getCharacterOwnedByUser(session.characterId, userId);
    character = formatCharacterPayload(owned);
  }
  return formatSessionPayload(session, { character });
};

const deleteSessionForUser = (sessionId, userId) => removeSession(sessionId, userId);

const findOwnedSession = (sessionId, userId) => getSessionOwnedByUser(sessionId, userId) || null;

module.exports = {
  listForUser,
  createForUser,
  getTranscriptForSession,
  renameSession,
  deleteSessionForUser,
  findOwnedSession,
  CHARACTER_NOT_FOUND,
};
