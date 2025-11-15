const express = require('express');
const { OLLAMA_MODEL } = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ model: OLLAMA_MODEL });
});

module.exports = router;
