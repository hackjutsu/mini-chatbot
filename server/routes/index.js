const express = require('express');
const usersRouter = require('./users');
const charactersRouter = require('./characters');
const sessionsRouter = require('./sessions');
const modelsRouter = require('./models');
const chatRouter = require('./chat');
const configRouter = require('./config');

const router = express.Router();

router.use('/users', usersRouter);
router.use('/characters', charactersRouter);
router.use('/sessions', sessionsRouter);
router.use('/models', modelsRouter);
router.use('/chat', chatRouter);
router.use('/config', configRouter);

module.exports = router;
