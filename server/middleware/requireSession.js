const sessionService = require('../services/sessionService');
const logger = require('../logger');

const requireSessionForUser =
  (extractSessionId, missingMessage = 'sessionId is required.') =>
  async (req, res, next) => {
    const sessionId = extractSessionId(req);
    if (!sessionId) {
      return res.status(400).json({ error: missingMessage });
    }
    const userId = req.user?.id;
    if (!userId) {
      logger.error('middleware.requireSession.missingUser', { sessionId });
      return res.status(500).json({ error: 'Unable to load session context.' });
    }
    const session = await sessionService.findOwnedSession(sessionId, userId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    req.session = session;
    return next();
  };

module.exports = {
  requireSessionForUser,
};
