const {
  createCharacter,
  getCharacterOwnedByUser,
  updateCharacter,
  removeCharacter,
  getCharactersForUser,
} = require('../../db');
const { formatCharacterPayload } = require('../helpers/payloads');

const listForUser = (userId) => getCharactersForUser(userId).map((character) => formatCharacterPayload(character));

const createForUser = (userId, { name, prompt, avatarUrl }) =>
  formatCharacterPayload(createCharacter(userId, { name, prompt, avatarUrl }));

const updateForUser = (characterId, userId, { name, prompt, avatarUrl }) => {
  const updated = updateCharacter(characterId, userId, { name, prompt, avatarUrl });
  return updated ? formatCharacterPayload(updated) : null;
};

const removeForUser = (characterId, userId) => removeCharacter(characterId, userId);

const getOwnedCharacter = (characterId, userId) => {
  const character = getCharacterOwnedByUser(characterId, userId);
  return character ? formatCharacterPayload(character) : null;
};

module.exports = {
  listForUser,
  createForUser,
  updateForUser,
  removeForUser,
  getOwnedCharacter,
};
