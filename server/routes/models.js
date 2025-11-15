const express = require('express');
const { fetchAvailableModels, resolveUserModel } = require('../services/ollamaService');
const { requireUserFromQuery } = require('../middleware/requireUser');
const userService = require('../services/userService');

const router = express.Router();

router.get('/', requireUserFromQuery(), async (req, res) => {
  const userId = req.user.id;
  const user = req.user;
  try {
    const models = await fetchAvailableModels();
    const selectedModel = resolveUserModel(user, models);
    if (selectedModel !== user.preferredModel) {
      userService.setPreferredModel(userId, selectedModel);
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
