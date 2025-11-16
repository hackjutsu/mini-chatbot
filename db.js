const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

const DEFAULT_SESSION_TITLE = 'New chat';
const CHARACTER_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};
const SYSTEM_USER_ID = '__system_character_owner__';
const SYSTEM_USERNAME = 'Mini Character Library';
const SYSTEM_USERNAME_NORMALIZED = '__system_character_owner__';

const DEFAULT_CHARACTERS = [
  {
    name: 'Nova the Explorer',
    shortDescription: 'Cosmic mapmaker who replies with vivid optimism.',
    prompt:
      'You are Nova, an upbeat astro-cartographer who speaks in vivid imagery about discoveries. Offer practical optimism and sprinkle in cosmic metaphors.',
    avatarUrl: '/avatars/nova.svg',
  },
  {
    name: 'Chef Lumi',
    shortDescription: 'Tactile culinary mentor with actionable steps.',
    prompt:
      'You are Chef Lumi, a warm culinary mentor who explains ideas through kitchen analogies. Answer with tactile descriptions and actionable steps.',
    avatarUrl: '/avatars/lumi.svg',
  },
  {
    name: 'Professor Willow',
    shortDescription: 'Thoughtful guide who balances curiosity with rigor.',
    prompt:
      'You are Professor Willow, a thoughtful mentor who balances curiosity with rigor. Guide the user with probing questions and concise wisdom.',
    avatarUrl: '/avatars/willow.svg',
  },
];
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
    preferred_model TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    prompt TEXT NOT NULL,
    avatar_url TEXT,
    short_description TEXT,
    status TEXT NOT NULL DEFAULT '${CHARACTER_STATUS.DRAFT}',
    version INTEGER NOT NULL DEFAULT 1,
    last_published_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS character_pins (
    user_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, character_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '${DEFAULT_SESSION_TITLE}',
    character_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

`);

const userTableInfo = db.prepare('PRAGMA table_info(users)').all();
const hasPreferredModelColumn = userTableInfo.some((column) => column.name === 'preferred_model');
if (!hasPreferredModelColumn) {
  db.exec('ALTER TABLE users ADD COLUMN preferred_model TEXT');
}

const characterTableInfo = db.prepare('PRAGMA table_info(characters)').all();
const requiredCharacterColumns = [
  'owner_user_id',
  'short_description',
  'status',
  'version',
  'last_published_at',
];
const needsCharacterTableMigration = requiredCharacterColumns.some(
  (column) => !characterTableInfo.some((existing) => existing.name === column)
);

if (needsCharacterTableMigration) {
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec('BEGIN TRANSACTION');
  db.exec(`
    CREATE TABLE characters_new (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      avatar_url TEXT,
      short_description TEXT,
      status TEXT NOT NULL DEFAULT '${CHARACTER_STATUS.DRAFT}',
      version INTEGER NOT NULL DEFAULT 1,
      last_published_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  db.exec(`
    INSERT INTO characters_new (
      id,
      owner_user_id,
      name,
      prompt,
      avatar_url,
      short_description,
      status,
      version,
      last_published_at,
      created_at,
      updated_at
    )
    SELECT
      id,
      user_id AS owner_user_id,
      name,
      prompt,
      avatar_url,
      NULL AS short_description,
      '${CHARACTER_STATUS.DRAFT}' AS status,
      1 AS version,
      NULL AS last_published_at,
      created_at,
      updated_at
    FROM characters;
  `);
  db.exec('DROP TABLE characters');
  db.exec('ALTER TABLE characters_new RENAME TO characters');
  db.exec('COMMIT');
  db.exec('PRAGMA foreign_keys = ON');
}

const sessionTableInfo = db.prepare('PRAGMA table_info(sessions)').all();
const hasCharacterColumn = sessionTableInfo.some((column) => column.name === 'character_id');
if (!hasCharacterColumn) {
  db.exec('ALTER TABLE sessions ADD COLUMN character_id TEXT REFERENCES characters(id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_character ON sessions(character_id)');
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_sessions_user_updated ON sessions(user_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_session_created ON messages(session_id, created_at ASC);
  CREATE INDEX IF NOT EXISTS idx_characters_owner ON characters(owner_user_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(status, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_character_pins_user ON character_pins(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_character_pins_character ON character_pins(character_id, user_id);
`);

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
      id,
      owner_user_id AS ownerUserId,
      name,
      prompt,
      avatar_url AS avatarUrl,
      short_description AS shortDescription,
      status,
      version,
      last_published_at AS lastPublishedAt,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM characters
    WHERE owner_user_id = ?
    ORDER BY updated_at DESC`
  ),
  findCharacterByOwnerAndName: db.prepare(
    `SELECT
      id,
      owner_user_id AS ownerUserId,
      name,
      prompt,
      avatar_url AS avatarUrl,
      short_description AS shortDescription,
      status,
      version,
      last_published_at AS lastPublishedAt,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM characters
    WHERE owner_user_id = ? AND name = ?`
  ),
  findPublishedCharacters: db.prepare(
    `SELECT
      id,
      owner_user_id AS ownerUserId,
      name,
      prompt,
      avatar_url AS avatarUrl,
      short_description AS shortDescription,
      status,
      version,
      last_published_at AS lastPublishedAt,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM characters
    WHERE status = ?
    ORDER BY updated_at DESC`
  ),
  findPublishedCharacterIdsByOwner: db.prepare(
    'SELECT id FROM characters WHERE owner_user_id = ? AND status = ? ORDER BY updated_at DESC'
  ),
  findCharacterById: db.prepare(
    `SELECT
      id,
      owner_user_id AS ownerUserId,
      name,
      prompt,
      avatar_url AS avatarUrl,
      short_description AS shortDescription,
      status,
      version,
      last_published_at AS lastPublishedAt,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM characters
    WHERE id = ?`
  ),
  findCharacterByOwnership: db.prepare(
    `SELECT
      id,
      owner_user_id AS ownerUserId,
      name,
      prompt,
      avatar_url AS avatarUrl,
      short_description AS shortDescription,
      status,
      version,
      last_published_at AS lastPublishedAt,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM characters
    WHERE id = ? AND owner_user_id = ?`
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
  insertCharacterPin: db.prepare('INSERT OR IGNORE INTO character_pins (user_id, character_id) VALUES (?, ?)'),
  deleteCharacterPin: db.prepare('DELETE FROM character_pins WHERE user_id = ? AND character_id = ?'),
  findPinsByUser: db.prepare(
    `SELECT character_id AS characterId, created_at AS createdAt
     FROM character_pins
     WHERE user_id = ?
     ORDER BY created_at ASC`
  ),
  findPinnedCharactersByUser: db.prepare(
    `SELECT
      c.id,
      c.owner_user_id AS ownerUserId,
      c.name,
      c.prompt,
      c.avatar_url AS avatarUrl,
      c.short_description AS shortDescription,
      c.status,
      c.version,
      c.last_published_at AS lastPublishedAt,
      c.created_at AS createdAt,
      c.updated_at AS updatedAt,
      p.created_at AS pinnedAt
    FROM character_pins p
    JOIN characters c ON c.id = p.character_id
    WHERE p.user_id = ?
    ORDER BY p.created_at ASC`
  ),
  findPinnedCharacterForUser: db.prepare(
    `SELECT
      c.id,
      c.owner_user_id AS ownerUserId,
      c.name,
      c.prompt,
      c.avatar_url AS avatarUrl,
      c.short_description AS shortDescription,
      c.status,
      c.version,
      c.last_published_at AS lastPublishedAt,
      c.created_at AS createdAt,
      c.updated_at AS updatedAt,
      p.created_at AS pinnedAt
    FROM character_pins p
    JOIN characters c ON c.id = p.character_id
    WHERE p.user_id = ? AND p.character_id = ?`
  ),
  findCharacterPin: db.prepare(
    'SELECT user_id AS userId, character_id AS characterId FROM character_pins WHERE user_id = ? AND character_id = ?'
  ),
  attachCharacterToSession: db.prepare(
    'UPDATE sessions SET character_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
  ),
};

const normalizeUsername = (username = '') => username.trim().toLowerCase();

const ensureSystemUserExists = () => {
  let existing = statements.findUserById.get(SYSTEM_USER_ID);
  if (existing) {
    return existing;
  }
  statements.createUser.run(SYSTEM_USER_ID, SYSTEM_USERNAME, SYSTEM_USERNAME_NORMALIZED, null);
  existing = statements.findUserById.get(SYSTEM_USER_ID);
  return existing;
};

const ensureDefaultCharactersSeeded = () => {
  ensureSystemUserExists();
  DEFAULT_CHARACTERS.forEach((character) => {
    const existing = statements.findCharacterByOwnerAndName.get(SYSTEM_USER_ID, character.name);
    if (existing) {
      return;
    }
    const id = randomUUID();
    statements.createCharacter.run(
      id,
      SYSTEM_USER_ID,
      character.name,
      character.prompt,
      character.avatarUrl || null,
      character.shortDescription || null
    );
    statements.publishCharacter.run(id, SYSTEM_USER_ID);
  });
};

const seedCharacterPinsForUser = (userId) => {
  const defaults = statements.findPublishedCharacterIdsByOwner.all(
    SYSTEM_USER_ID,
    CHARACTER_STATUS.PUBLISHED
  );
  defaults.forEach(({ id }) => {
    statements.insertCharacterPin.run(userId, id);
  });
};

ensureDefaultCharactersSeeded();

const createUser = (username, preferredModel = null) => {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    throw new Error('Username required');
  }
  const id = randomUUID();
  statements.createUser.run(id, username.trim(), normalized, preferredModel || null);
  seedCharacterPinsForUser(id);
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

const getCharactersPinnedByUser = (userId) => statements.findPinnedCharactersByUser.all(userId);

const getPinnedCharacterForUser = (userId, characterId) =>
  statements.findPinnedCharacterForUser.get(userId, characterId) || null;

const pinCharacterForUser = (userId, characterId) => {
  statements.insertCharacterPin.run(userId, characterId);
  return true;
};

const unpinCharacterForUser = (userId, characterId) => {
  const info = statements.deleteCharacterPin.run(userId, characterId);
  return info.changes > 0;
};

const isCharacterPinnedByUser = (userId, characterId) =>
  Boolean(statements.findCharacterPin.get(userId, characterId));

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
  getCharactersPinnedByUser,
  getPinnedCharacterForUser,
  pinCharacterForUser,
  unpinCharacterForUser,
  isCharacterPinnedByUser,
  updateCharacter,
  publishCharacter,
  unpublishCharacter,
  removeCharacter,
  attachCharacterToSession,
};
