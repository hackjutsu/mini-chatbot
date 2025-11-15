const express = require('express');
const {
  getUserById,
  createCharacter,
  getCharacterOwnedByUser,
  updateCharacter,
  removeCharacter,
} = require('../../db');
const { ensureSeedCharacters } = require('../helpers/characters');
const { formatCharacterPayload } = require('../helpers/payloads');

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
  const characters = ensureSeedCharacters(userId).map((character) => formatCharacterPayload(character));
  return res.json({ characters });
});

router.post('/', (req, res) => {
  const { userId, name, prompt, avatarUrl } = req.body || {};
  if (!userId || typeof name !== 'string' || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'userId, name, and prompt are required.' });
  }
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  try {
    const character = createCharacter(userId, { name, prompt, avatarUrl });
    return res.status(201).json({ character: formatCharacterPayload(character) });
  } catch (error) {
    console.error('Failed to create character:', error);
    return res.status(500).json({ error: 'Unable to create character.' });
  }
});

router.patch('/:characterId', (req, res) => {
  const { characterId } = req.params;
  const { userId, name, prompt, avatarUrl } = req.body || {};
  if (!userId || typeof name !== 'string' || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'userId, name, and prompt are required.' });
  }
  const existing = getCharacterOwnedByUser(characterId, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Character not found.' });
  }
  const updated = updateCharacter(characterId, userId, { name, prompt, avatarUrl });
  if (!updated) {
    return res.status(500).json({ error: 'Unable to update character.' });
  }
  return res.json({ character: formatCharacterPayload(updated) });
});

router.delete('/:characterId', (req, res) => {
  const { characterId } = req.params;
  const userId = req.body?.userId || req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }
  const existing = getCharacterOwnedByUser(characterId, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Character not found.' });
  }
  const removed = removeCharacter(characterId, userId);
  if (!removed) {
    return res.status(500).json({ error: 'Unable to delete character.' });
  }
  return res.status(204).end();
});

module.exports = router;
