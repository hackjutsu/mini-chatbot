const express = require('express');
const {
  createUser,
  getUserByUsername,
  setUserPreferredModel,
} = require('../../db');
const { formatUserPayload } = require('../helpers/payloads');
const { isValidUsername } = require('../helpers/validation');
const { OLLAMA_MODEL } = require('../config');
const { fetchAvailableModels } = require('../services/ollamaService');
const { requireUserFromParam } = require('../middleware/requireUser');

const router = express.Router();

router.post('/', (req, res) => {
  const username = req.body?.username;
  if (typeof username !== 'string' || !isValidUsername(username)) {
    return res
      .status(400)
      .json({ error: 'Username must be 3-32 characters (letters, numbers, _ or -).' });
  }

  const existing = getUserByUsername(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already exists.' });
  }

  try {
    const user = createUser(username.trim(), OLLAMA_MODEL);
    return res.status(201).json(formatUserPayload(user, OLLAMA_MODEL));
  } catch (error) {
    console.error('Failed to create user:', error);
    return res.status(500).json({ error: 'Unable to create user.' });
  }
});

router.patch(
  '/:userId/model',
  requireUserFromParam('userId'),
  async (req, res) => {
    const { userId } = req.params;
    const { model } = req.body || {};
    if (!model || typeof model !== 'string') {
      return res.status(400).json({ error: 'model is required.' });
    }
    try {
      const models = await fetchAvailableModels();
      if (!models.includes(model)) {
        return res.status(400).json({ error: 'Model is not available on the server.' });
      }
      setUserPreferredModel(userId, model);
      return res.json({ model });
    } catch (error) {
      console.error('Failed to update user model:', error);
      return res.status(502).json({ error: 'Unable to update model preference.' });
    }
  }
);

router.get('/:username', (req, res) => {
  const username = req.params.username;
  if (!isValidUsername(username)) {
    return res.status(400).json({ error: 'Invalid username.' });
  }
  const user = getUserByUsername(username);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json(formatUserPayload(user, OLLAMA_MODEL));
});

module.exports = router;
