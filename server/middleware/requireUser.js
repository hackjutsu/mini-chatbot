const userService = require('../services/userService');

const createUserMiddleware =
  (extractUserId, missingMessage = 'userId is required.') =>
  async (req, res, next) => {
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(400).json({ error: missingMessage });
    }
    const user = await userService.getById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    req.user = user;
    return next();
  };

const requireUserFromBody = (field = 'userId', message = 'userId is required.') =>
  createUserMiddleware((req) => req.body?.[field], message);

const requireUserFromQuery = (field = 'userId', message = 'userId query parameter is required.') =>
  createUserMiddleware((req) => req.query?.[field], message);

const requireUserFromParam = (paramName = 'userId', message = 'userId is required.') =>
  createUserMiddleware((req) => req.params?.[paramName], message);

const requireUserFromBodyOrQuery = (field = 'userId', message = 'userId is required.') =>
  createUserMiddleware((req) => req.body?.[field] || req.query?.[field], message);

module.exports = {
  requireUserFromBody,
  requireUserFromQuery,
  requireUserFromParam,
  requireUserFromBodyOrQuery,
};
