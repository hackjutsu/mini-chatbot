const {
  CHARACTER_STATUS,
  createCharacter,
  getCharacterOwnedByUser,
  updateCharacter,
  removeCharacter,
  getCharactersForUser,
  getPublishedCharacters,
  publishCharacter,
  unpublishCharacter,
  getCharacterById,
} = require('../../db');
const { formatCharacterPayload } = require('../helpers/payloads');

const formatList = (characters = []) => characters.map((character) => formatCharacterPayload(character));

const listOwned = (userId) => formatList(getCharactersForUser(userId));

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
  return formatCharacterPayload(character);
};

module.exports = {
  listOwned,
  listPublished,
  createForUser,
  updateForUser,
  removeForUser,
  publishForUser,
  unpublishForUser,
  getOwnedCharacter,
  getCharacterForUser,
};
