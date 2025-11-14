const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

const DEFAULT_SESSION_TITLE = 'New chat';
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'chat.sqlite');

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    username_normalized TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '${DEFAULT_SESSION_TITLE}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user_updated ON sessions(user_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_session_created ON messages(session_id, created_at ASC);
`);

const statements = {
  createUser: db.prepare(
    'INSERT INTO users (id, username, username_normalized) VALUES (?, ?, ?)'
  ),
  findUserByUsername: db.prepare(
    'SELECT id, username, username_normalized AS usernameNormalized, created_at AS createdAt FROM users WHERE username_normalized = ?'
  ),
  findUserById: db.prepare(
    'SELECT id, username, username_normalized AS usernameNormalized, created_at AS createdAt FROM users WHERE id = ?'
  ),
  createSession: db.prepare(
    'INSERT INTO sessions (id, user_id, title) VALUES (?, ?, ?)'
  ),
  findSessionsByUser: db.prepare(
    `SELECT
      s.id,
      s.user_id AS userId,
      s.title,
      s.created_at AS createdAt,
      s.updated_at AS updatedAt,
      COALESCE(m.count, 0) AS messageCount
    FROM sessions s
    LEFT JOIN (
      SELECT session_id, COUNT(*) AS count
      FROM messages
      GROUP BY session_id
    ) m ON m.session_id = s.id
    WHERE s.user_id = ?
    ORDER BY s.updated_at DESC`
  ),
  findSessionById: db.prepare(
    'SELECT id, user_id AS userId, title, created_at AS createdAt, updated_at AS updatedAt FROM sessions WHERE id = ?'
  ),
  findSessionByOwnership: db.prepare(
    'SELECT id, user_id AS userId, title, created_at AS createdAt, updated_at AS updatedAt FROM sessions WHERE id = ? AND user_id = ?'
  ),
  updateSessionTitle: db.prepare(
    'UPDATE sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
  ),
  deleteSession: db.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?'),
  insertMessage: db.prepare(
    'INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)'
  ),
  findMessagesForSession: db.prepare(
    'SELECT id, role, content, created_at AS createdAt FROM messages WHERE session_id = ? ORDER BY created_at ASC'
  ),
  touchSession: db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
};

const normalizeUsername = (username = '') => username.trim().toLowerCase();

const createUser = (username) => {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    throw new Error('Username required');
  }
  const id = randomUUID();
  statements.createUser.run(id, username.trim(), normalized);
  return statements.findUserById.get(id);
};

const getUserByUsername = (username) => {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  return statements.findUserByUsername.get(normalized) || null;
};

const getUserById = (userId) => statements.findUserById.get(userId) || null;

const createSession = (userId, title = DEFAULT_SESSION_TITLE) => {
  const id = randomUUID();
  statements.createSession.run(id, userId, title || DEFAULT_SESSION_TITLE);
  return statements.findSessionById.get(id);
};

const getSessionsForUser = (userId) => statements.findSessionsByUser.all(userId);

const getSessionOwnedByUser = (sessionId, userId) =>
  statements.findSessionByOwnership.get(sessionId, userId) || null;

const updateSessionTitle = (sessionId, userId, title) => {
  const finalTitle = title?.trim() || DEFAULT_SESSION_TITLE;
  const info = statements.updateSessionTitle.run(finalTitle, sessionId, userId);
  return info.changes > 0;
};

const removeSession = (sessionId, userId) => {
  const info = statements.deleteSession.run(sessionId, userId);
  return info.changes > 0;
};

const getMessagesForSession = (sessionId) => statements.findMessagesForSession.all(sessionId);

const addMessage = (sessionId, role, content) => {
  const id = randomUUID();
  statements.insertMessage.run(id, sessionId, role, content);
  statements.touchSession.run(sessionId);
  return id;
};

module.exports = {
  DEFAULT_SESSION_TITLE,
  createSession,
  createUser,
  getMessagesForSession,
  getSessionOwnedByUser,
  getSessionsForUser,
  getUserById,
  getUserByUsername,
  removeSession,
  updateSessionTitle,
  addMessage,
};
