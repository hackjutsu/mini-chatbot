const { getCharactersForUser, seedCharactersForUser } = require('../../db');

const ensureSeedCharacters = (userId) => {
  const characters = getCharactersForUser(userId);
  if (characters.length > 0) {
    return characters;
  }
  return seedCharactersForUser(userId);
};

module.exports = {
  ensureSeedCharacters,
};
