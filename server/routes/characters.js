const express = require('express');
const {
  requireUserFromQuery,
  requireUserFromBody,
  requireUserFromBodyOrQuery,
} = require('../middleware/requireUser');
const characterService = require('../services/characterService');

const router = express.Router();

const ensureValidCharacterPayload = ({ name, prompt }) =>
  typeof name === 'string' && name.trim().length > 0 && typeof prompt === 'string' && prompt.trim().length > 0;

router.get('/', requireUserFromQuery(), (req, res) => {
  const userId = req.user.id;
  const owned = characterService.listOwned(userId);
  return res.json({ owned });
});

router.get('/published', requireUserFromQuery(), (req, res) => {
  const published = characterService.listPublished();
  return res.json({ characters: published });
});

router.post('/', requireUserFromBody(), (req, res) => {
  const { name, prompt, avatarUrl, shortDescription } = req.body || {};
  if (!ensureValidCharacterPayload({ name, prompt })) {
    return res.status(400).json({ error: 'userId, name, and prompt are required.' });
  }
  const userId = req.user.id;
  try {
    const character = characterService.createForUser(userId, {
      name,
      prompt,
      avatarUrl,
      shortDescription,
    });
    return res.status(201).json({ character });
  } catch (error) {
    console.error('Failed to create character:', error);
    return res.status(500).json({ error: 'Unable to create character.' });
  }
});

router.patch('/:characterId', requireUserFromBody(), (req, res) => {
  const { characterId } = req.params;
  const { name, prompt, avatarUrl, shortDescription } = req.body || {};
  if (!ensureValidCharacterPayload({ name, prompt })) {
    return res.status(400).json({ error: 'userId, name, and prompt are required.' });
  }
  const userId = req.user.id;
  const updated = characterService.updateForUser(characterId, userId, {
    name,
    prompt,
    avatarUrl,
    shortDescription,
  });
  if (!updated) {
    return res.status(404).json({ error: 'Character not found.' });
  }
  return res.json({ character: updated });
});

router.post('/:characterId/publish', requireUserFromBody(), (req, res) => {
  const { characterId } = req.params;
  const userId = req.user.id;
  const updated = characterService.publishForUser(characterId, userId);
  if (!updated) {
    return res.status(404).json({ error: 'Character not found.' });
  }
  return res.json({ character: updated });
});

router.post('/:characterId/unpublish', requireUserFromBody(), (req, res) => {
  const { characterId } = req.params;
  const userId = req.user.id;
  const updated = characterService.unpublishForUser(characterId, userId);
  if (!updated) {
    return res.status(404).json({ error: 'Character not found.' });
  }
  return res.json({ character: updated });
});

router.delete('/:characterId', requireUserFromBodyOrQuery(), (req, res) => {
  const { characterId } = req.params;
  const userId = req.user.id;
  const removed = characterService.removeForUser(characterId, userId);
  if (!removed) {
    return res.status(404).json({ error: 'Character not found.' });
  }
  return res.status(204).end();
});

module.exports = router;
