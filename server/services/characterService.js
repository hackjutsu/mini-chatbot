const {
  CHARACTER_STATUS,
  createCharacter,
  getCharacterOwnedByUser,
  updateCharacter,
  removeCharacter,
  getCharactersForUser,
  getPublishedCharacters,
  getCharactersPinnedByUser,
  getPinnedCharacterForUser,
  pinCharacterForUser,
  unpinCharacterForUser,
  isCharacterPinnedByUser,
  publishCharacter,
  unpublishCharacter,
  getCharacterById,
} = require('../../db');
const { formatCharacterPayload } = require('../helpers/payloads');

const CharacterError = {
  NOT_FOUND: 'CHARACTER_NOT_FOUND',
  NOT_PUBLISHED: 'CHARACTER_NOT_PUBLISHED',
  NOT_PINNED: 'CHARACTER_NOT_PINNED',
};

const formatList = (characters = []) => characters.map((character) => formatCharacterPayload(character));

const listOwned = (userId) => formatList(getCharactersForUser(userId));

const listPinned = (userId) => formatList(getCharactersPinnedByUser(userId));

const listPublished = () => formatList(getPublishedCharacters());

const createForUser = (userId, payload) => formatCharacterPayload(createCharacter(userId, payload));

const updateForUser = (characterId, userId, payload) => {
  const updated = updateCharacter(characterId, userId, payload);
  return updated ? formatCharacterPayload(updated) : null;
};

const removeForUser = (characterId, userId) => removeCharacter(characterId, userId);

const publishForUser = (characterId, userId) => {
  const updated = publishCharacter(characterId, userId);
  if (!updated) {
    return null;
  }
  return formatCharacterPayload(updated);
};

const unpublishForUser = (characterId, userId) => {
  const updated = unpublishCharacter(characterId, userId);
  if (!updated) {
    return null;
  }
  return formatCharacterPayload(updated);
};

const getOwnedCharacter = (characterId, userId) => {
  const character = getCharacterOwnedByUser(characterId, userId);
  return character ? formatCharacterPayload(character) : null;
};

const getCharacterForUser = (characterId, userId) => {
  const owned = getCharacterOwnedByUser(characterId, userId);
  if (owned) {
    return formatCharacterPayload(owned);
  }
  const character = getCharacterById(characterId);
  if (!character || character.status !== CHARACTER_STATUS.PUBLISHED) {
    return null;
  }
  if (!isCharacterPinnedByUser(userId, characterId)) {
    return null;
  }
  const pinned = getPinnedCharacterForUser(userId, characterId);
  return formatCharacterPayload(pinned || character);
};

const pinForUser = (characterId, userId) => {
  const character = getCharacterById(characterId);
  if (!character) {
    const error = new Error('Character not found.');
    error.code = CharacterError.NOT_FOUND;
    throw error;
  }

  const isOwner = character.ownerUserId === userId;
  const isPublished = character.status === CHARACTER_STATUS.PUBLISHED;
  if (!isOwner && !isPublished) {
    const error = new Error('Character is not published.');
    error.code = CharacterError.NOT_PUBLISHED;
    throw error;
  }
  pinCharacterForUser(userId, characterId);
  const pinned = getPinnedCharacterForUser(userId, characterId);
  return pinned ? formatCharacterPayload(pinned) : formatCharacterPayload(character);
};

const unpinForUser = (characterId, userId) => {
  if (!isCharacterPinnedByUser(userId, characterId)) {
    const error = new Error('Character is not pinned.');
    error.code = CharacterError.NOT_PINNED;
    throw error;
  }
  unpinCharacterForUser(userId, characterId);
  return true;
};

module.exports = {
  CharacterError,
  listOwned,
  listPinned,
  listPublished,
  createForUser,
  updateForUser,
  removeForUser,
  publishForUser,
  unpublishForUser,
  getOwnedCharacter,
  getCharacterForUser,
  pinForUser,
  unpinForUser,
};
