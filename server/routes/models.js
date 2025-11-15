const express = require('express');
const { getUserById, setUserPreferredModel } = require('../../db');
const { fetchAvailableModels, resolveUserModel } = require('../services/ollamaService');

const router = express.Router();

router.get('/', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required.' });
  }
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  try {
    const models = await fetchAvailableModels();
    const selectedModel = resolveUserModel(user, models);
    if (selectedModel !== user.preferredModel) {
      setUserPreferredModel(userId, selectedModel);
      user.preferredModel = selectedModel;
    }
    return res.json({
      models,
      selectedModel,
    });
  } catch (error) {
    console.error('Failed to load models list:', error);
    return res.status(502).json({ error: 'Unable to load model list from Ollama.' });
  }
});

module.exports = router;
