const runMigrations = (db, { DEFAULT_SESSION_TITLE, CHARACTER_STATUS }) => {
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
  `);
};

module.exports = { runMigrations };
