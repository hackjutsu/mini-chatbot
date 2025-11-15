const express = require('express');
const {
  requireUserFromQuery,
  requireUserFromBody,
  requireUserFromBodyOrQuery,
} = require('../middleware/requireUser');
const characterService = require('../services/characterService');

const router = express.Router();

router.get('/', requireUserFromQuery(), (req, res) => {
  const userId = req.user.id;
  const characters = characterService.listForUser(userId);
  return res.json({ characters });
});

router.post('/', requireUserFromBody(), (req, res) => {
  const { name, prompt, avatarUrl } = req.body || {};
  if (typeof name !== 'string' || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'userId, name, and prompt are required.' });
  }
  const userId = req.user.id;
  try {
    const character = characterService.createForUser(userId, { name, prompt, avatarUrl });
    return res.status(201).json({ character });
  } catch (error) {
    console.error('Failed to create character:', error);
    return res.status(500).json({ error: 'Unable to create character.' });
  }
});

router.patch('/:characterId', requireUserFromBody(), (req, res) => {
  const { characterId } = req.params;
  const { name, prompt, avatarUrl } = req.body || {};
  if (typeof name !== 'string' || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'userId, name, and prompt are required.' });
  }
  const userId = req.user.id;
  const existing = characterService.getOwnedCharacter(characterId, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Character not found.' });
  }
  const updated = characterService.updateForUser(characterId, userId, { name, prompt, avatarUrl });
  if (!updated) {
    return res.status(500).json({ error: 'Unable to update character.' });
  }
  return res.json({ character: updated });
});

router.delete('/:characterId', requireUserFromBodyOrQuery(), (req, res) => {
  const { characterId } = req.params;
  const userId = req.user.id;
  const existing = characterService.getOwnedCharacter(characterId, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Character not found.' });
  }
  const removed = characterService.removeForUser(characterId, userId);
  if (!removed) {
    return res.status(500).json({ error: 'Unable to delete character.' });
  }
  return res.status(204).end();
});

module.exports = router;
