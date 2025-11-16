const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');
const { runMigrations } = require('./migrations');
const { seedDefaultCharacters } = require('./seed');

const DEFAULT_SESSION_TITLE = 'New chat';
const CHARACTER_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'chat.sqlite');

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

runMigrations(db, { DEFAULT_SESSION_TITLE, CHARACTER_STATUS });

const statements = {
  createUser: db.prepare(
    'INSERT INTO users (id, username, username_normalized, preferred_model) VALUES (?, ?, ?, ?)'
  ),
  findUserByUsername: db.prepare(
    `SELECT
      id,
      username,
      username_normalized AS usernameNormalized,
      preferred_model AS preferredModel,
      created_at AS createdAt
    FROM users
    WHERE username_normalized = ?`
  ),
  findUserById: db.prepare(
    `SELECT
      id,
      username,
      username_normalized AS usernameNormalized,
      preferred_model AS preferredModel,
      created_at AS createdAt
    FROM users
    WHERE id = ?`
  ),
  createSession: db.prepare(
    'INSERT INTO sessions (id, user_id, title, character_id) VALUES (?, ?, ?, ?)'
  ),
  findSessionsByUser: db.prepare(
    `SELECT
      s.id,
      s.user_id AS userId,
      s.title,
      s.character_id AS characterId,
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
    'SELECT id, user_id AS userId, title, character_id AS characterId, created_at AS createdAt, updated_at AS updatedAt FROM sessions WHERE id = ?'
  ),
  findSessionByOwnership: db.prepare(
    'SELECT id, user_id AS userId, title, character_id AS characterId, created_at AS createdAt, updated_at AS updatedAt FROM sessions WHERE id = ? AND user_id = ?'
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
  updateUserModel: db.prepare('UPDATE users SET preferred_model = ? WHERE id = ?'),
  createCharacter: db.prepare(
    'INSERT INTO characters (id, owner_user_id, name, prompt, avatar_url, short_description) VALUES (?, ?, ?, ?, ?, ?)'
  ),
  findCharactersByOwner: db.prepare(
    `SELECT
      c.id,
      c.owner_user_id AS ownerUserId,
      u.username AS ownerUsername,
      c.name,
      c.prompt,
      c.avatar_url AS avatarUrl,
      c.short_description AS shortDescription,
      c.status,
      c.version,
      c.last_published_at AS lastPublishedAt,
      c.created_at AS createdAt,
      c.updated_at AS updatedAt
    FROM characters c
    JOIN users u ON u.id = c.owner_user_id
    WHERE c.owner_user_id = ?
    ORDER BY c.updated_at DESC`
  ),
  findCharacterByOwnerAndName: db.prepare(
    `SELECT
      c.id,
      c.owner_user_id AS ownerUserId,
      u.username AS ownerUsername,
      c.name,
      c.prompt,
      c.avatar_url AS avatarUrl,
      c.short_description AS shortDescription,
      c.status,
      c.version,
      c.last_published_at AS lastPublishedAt,
      c.created_at AS createdAt,
      c.updated_at AS updatedAt
    FROM characters c
    JOIN users u ON u.id = c.owner_user_id
    WHERE c.owner_user_id = ? AND c.name = ?`
  ),
  findPublishedCharacters: db.prepare(
    `SELECT
      c.id,
      c.owner_user_id AS ownerUserId,
      u.username AS ownerUsername,
      c.name,
      c.prompt,
      c.avatar_url AS avatarUrl,
      c.short_description AS shortDescription,
      c.status,
      c.version,
      c.last_published_at AS lastPublishedAt,
      c.created_at AS createdAt,
      c.updated_at AS updatedAt
    FROM characters c
    JOIN users u ON u.id = c.owner_user_id
    WHERE c.status = ?
    ORDER BY c.updated_at DESC`
  ),
  findPublishedCharacterIdsByOwner: db.prepare(
    'SELECT id FROM characters WHERE owner_user_id = ? AND status = ? ORDER BY updated_at DESC'
  ),
  findCharacterById: db.prepare(
    `SELECT
      c.id,
      c.owner_user_id AS ownerUserId,
      u.username AS ownerUsername,
      c.name,
      c.prompt,
      c.avatar_url AS avatarUrl,
      c.short_description AS shortDescription,
      c.status,
      c.version,
      c.last_published_at AS lastPublishedAt,
      c.created_at AS createdAt,
      c.updated_at AS updatedAt
    FROM characters c
    JOIN users u ON u.id = c.owner_user_id
    WHERE c.id = ?`
  ),
  findCharacterByOwnership: db.prepare(
    `SELECT
      c.id,
      c.owner_user_id AS ownerUserId,
      u.username AS ownerUsername,
      c.name,
      c.prompt,
      c.avatar_url AS avatarUrl,
      c.short_description AS shortDescription,
      c.status,
      c.version,
      c.last_published_at AS lastPublishedAt,
      c.created_at AS createdAt,
      c.updated_at AS updatedAt
    FROM characters c
    JOIN users u ON u.id = c.owner_user_id
    WHERE c.id = ? AND c.owner_user_id = ?`
  ),
  updateCharacter: db.prepare(
    `UPDATE characters
     SET name = ?, prompt = ?, avatar_url = ?, short_description = ?, updated_at = CURRENT_TIMESTAMP, version = version + 1
     WHERE id = ? AND owner_user_id = ?`
  ),
  publishCharacter: db.prepare(
    `UPDATE characters
     SET status = '${CHARACTER_STATUS.PUBLISHED}', last_published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND owner_user_id = ?`
  ),
  unpublishCharacter: db.prepare(
    `UPDATE characters
     SET status = '${CHARACTER_STATUS.DRAFT}', updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND owner_user_id = ?`
  ),
  deleteCharacter: db.prepare('DELETE FROM characters WHERE id = ? AND owner_user_id = ?'),
  attachCharacterToSession: db.prepare(
    'UPDATE sessions SET character_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
  ),
};

seedDefaultCharacters(statements);

const normalizeUsername = (username = '') => username.trim().toLowerCase();

const createUser = (username, preferredModel = null) => {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    throw new Error('Username required');
  }
  const id = randomUUID();
  statements.createUser.run(id, username.trim(), normalized, preferredModel || null);
  return statements.findUserById.get(id);
};

const getUserByUsername = (username) => {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  return statements.findUserByUsername.get(normalized) || null;
};

const getUserById = (userId) => statements.findUserById.get(userId) || null;

const createSession = (userId, title = DEFAULT_SESSION_TITLE, characterId = null) => {
  const id = randomUUID();
  statements.createSession.run(id, userId, title || DEFAULT_SESSION_TITLE, characterId);
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

const setUserPreferredModel = (userId, model) => {
  statements.updateUserModel.run(model ?? null, userId);
};

const createCharacter = (userId, { name, prompt, avatarUrl = null, shortDescription = null }) => {
  const id = randomUUID();
  statements.createCharacter.run(
    id,
    userId,
    name.trim(),
    prompt.trim(),
    avatarUrl || null,
    shortDescription?.trim() || null
  );
  return statements.findCharacterById.get(id);
};

const getCharactersForUser = (userId) => statements.findCharactersByOwner.all(userId);

const getCharacterOwnedByUser = (characterId, userId) =>
  statements.findCharacterByOwnership.get(characterId, userId) || null;

const getCharacterById = (characterId) => statements.findCharacterById.get(characterId) || null;

const getPublishedCharacters = () => statements.findPublishedCharacters.all(CHARACTER_STATUS.PUBLISHED);

const updateCharacter = (characterId, userId, { name, prompt, avatarUrl = null, shortDescription = null }) => {
  const info = statements.updateCharacter.run(
    name.trim(),
    prompt.trim(),
    avatarUrl || null,
    shortDescription?.trim() || null,
    characterId,
    userId
  );
  return info.changes > 0 ? getCharacterOwnedByUser(characterId, userId) : null;
};

const publishCharacter = (characterId, userId) => {
  const info = statements.publishCharacter.run(characterId, userId);
  return info.changes > 0 ? getCharacterOwnedByUser(characterId, userId) : null;
};

const unpublishCharacter = (characterId, userId) => {
  const info = statements.unpublishCharacter.run(characterId, userId);
  return info.changes > 0 ? getCharacterOwnedByUser(characterId, userId) : null;
};

const removeCharacter = (characterId, userId) => {
  const info = statements.deleteCharacter.run(characterId, userId);
  return info.changes > 0;
};

const attachCharacterToSession = (sessionId, userId, characterId) => {
  const info = statements.attachCharacterToSession.run(characterId, sessionId, userId);
  return info.changes > 0;
};

module.exports = {
  DEFAULT_SESSION_TITLE,
  CHARACTER_STATUS,
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
  setUserPreferredModel,
  createCharacter,
  getCharactersForUser,
  getCharacterOwnedByUser,
  getCharacterById,
  getPublishedCharacters,
  updateCharacter,
  publishCharacter,
  unpublishCharacter,
  removeCharacter,
  attachCharacterToSession,
};
