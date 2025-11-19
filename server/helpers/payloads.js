const { DEFAULT_SESSION_TITLE } = require('../../db');
const { normalizeTimestamp } = require('./dates');

const formatCharacterPayload = (character) => {
  if (!character) return null;
  return {
    id: character.id,
    ownerUserId: character.ownerUserId,
    ownerUsername: character.ownerUsername || null,
    name: character.name,
    prompt: character.prompt,
    avatarUrl: character.avatarUrl || null,
    shortDescription: character.shortDescription || null,
    status: character.status || null,
    version: typeof character.version === 'number' ? character.version : null,
    lastPublishedAt: normalizeTimestamp(character.lastPublishedAt),
    createdAt: normalizeTimestamp(character.createdAt),
    updatedAt: normalizeTimestamp(character.updatedAt),
  };
};

const formatSessionPayload = (session, overrides = {}) => {
  if (!session) return null;
  const characterOverride = overrides.character;
  return {
    id: session.id,
    title: session.title || DEFAULT_SESSION_TITLE,
    createdAt: normalizeTimestamp(session.createdAt),
    updatedAt: normalizeTimestamp(session.updatedAt),
    messageCount:
      typeof session.messageCount === 'number'
        ? session.messageCount
        : overrides.messageCount ?? 0,
    characterId: session.characterId || null,
    character: characterOverride || null,
  };
};

const formatUserPayload = (user, defaultModel) => {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    preferredModel: user.preferredModel || defaultModel,
  };
};

module.exports = {
  formatCharacterPayload,
  formatSessionPayload,
  formatUserPayload,
};
