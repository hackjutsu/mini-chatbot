const { DEFAULT_SESSION_TITLE, updateSessionTitle } = require('../../db');

const deriveTitleFromMessage = (content = '') => {
  const trimmed = content.replace(/\s+/g, ' ').trim();
  if (!trimmed) return null;
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
};

const maybeAutoTitleSession = (session, userId, content) => {
  if (!session) return;
  const isDefault = !session.title || session.title === DEFAULT_SESSION_TITLE;
  if (!isDefault) return;
  const candidate = deriveTitleFromMessage(content);
  if (!candidate) return;
  if (updateSessionTitle(session.id, userId, candidate)) {
    session.title = candidate;
  }
};

module.exports = {
  deriveTitleFromMessage,
  maybeAutoTitleSession,
};
