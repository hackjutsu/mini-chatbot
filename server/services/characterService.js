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
const cache = require('../cache');
const { publishedCharacterKey } = require('../cache/keys');
const { formatCharacterPayload } = require('../helpers/payloads');

const formatList = (characters = []) => characters.map((character) => formatCharacterPayload(character));

const PUBLISHED_CHARACTER_CACHE_TTL_MS = 5 * 60 * 1000;

const cachePublishedCharacter = (characterView) => {
  if (characterView?.status === CHARACTER_STATUS.PUBLISHED) {
    cache.set(publishedCharacterKey(characterView.id), characterView, PUBLISHED_CHARACTER_CACHE_TTL_MS);
  }
};

const invalidatePublishedCharacter = (characterId) => {
  if (!characterId) return;
  cache.delete(publishedCharacterKey(characterId));
};

const loadPublishedCharacter = (characterId) => {
  const character = getCharacterById(characterId);
  if (!character || character.status !== CHARACTER_STATUS.PUBLISHED) {
    return null;
  }
  return formatCharacterPayload(character);
};

const getPublishedCharacterView = (characterId) =>
  cache.wrap(publishedCharacterKey(characterId), PUBLISHED_CHARACTER_CACHE_TTL_MS, () =>
    loadPublishedCharacter(characterId)
  ) || null;

const listOwned = (userId) => formatList(getCharactersForUser(userId));

const listPublished = () => formatList(getPublishedCharacters());

const createForUser = (userId, payload) => formatCharacterPayload(createCharacter(userId, payload));

const updateForUser = (characterId, userId, payload) => {
  const updated = updateCharacter(characterId, userId, payload);
  if (!updated) {
    return null;
  }
  const view = formatCharacterPayload(updated);
  if (view.status === CHARACTER_STATUS.PUBLISHED) {
    cachePublishedCharacter(view);
  } else {
    invalidatePublishedCharacter(view.id);
  }
  return view;
};

const removeForUser = (characterId, userId) => {
  const removed = removeCharacter(characterId, userId);
  if (removed) {
    invalidatePublishedCharacter(characterId);
  }
  return removed;
};

const publishForUser = (characterId, userId) => {
  const updated = publishCharacter(characterId, userId);
  if (!updated) {
    return null;
  }
  const view = formatCharacterPayload(updated);
  cachePublishedCharacter(view);
  return view;
};

const unpublishForUser = (characterId, userId) => {
  const updated = unpublishCharacter(characterId, userId);
  if (!updated) {
    return null;
  }
  const view = formatCharacterPayload(updated);
  invalidatePublishedCharacter(view.id);
  return view;
};

const getOwnedCharacter = (characterId, userId) => {
  const character = getCharacterOwnedByUser(characterId, userId);
  return character ? formatCharacterPayload(character) : null;
};

const getCharacterForUser = (characterId, userId) => {
  const cached = cache.get(publishedCharacterKey(characterId));
  if (cached) {
    return cached;
  }
  const owned = getCharacterOwnedByUser(characterId, userId);
  if (owned) {
    return formatCharacterPayload(owned);
  }
  return getPublishedCharacterView(characterId);
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
