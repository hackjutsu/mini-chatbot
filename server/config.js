const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 3000;
const OLLAMA_CHAT_URL = process.env.OLLAMA_CHAT_URL || 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

const CLIENT_DIST_DIR = path.join(ROOT_DIR, 'client', 'dist');
const CLIENT_INDEX_PATH = path.join(CLIENT_DIST_DIR, 'index.html');
const hasClientBuild = fs.existsSync(CLIENT_INDEX_PATH);
const staticRoots = [];
if (hasClientBuild) {
  staticRoots.push(CLIENT_DIST_DIR);
} else {
  console.warn(
    'React client build not found. Run `npm --prefix client install` and `npm --prefix client run build` to generate the frontend bundle.'
  );
}

const legacyPublicDir = path.join(ROOT_DIR, 'public');
if (fs.existsSync(legacyPublicDir)) {
  staticRoots.push(legacyPublicDir);
}

module.exports = {
  PORT,
  OLLAMA_CHAT_URL,
  OLLAMA_MODEL,
  CLIENT_INDEX_PATH,
  hasClientBuild,
  staticRoots,
};
