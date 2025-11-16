const { LOG_LEVEL } = require('./config');

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const COLORS = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[90m',
};
const MODEL_COLORS = ['\x1b[35m', '\x1b[36m', '\x1b[32m', '\x1b[34m', '\x1b[33m'];
const RESET = '\x1b[0m';

const currentLevel = LEVELS[LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

const hashModelColor = (model) => {
  let hash = 0;
  for (let i = 0; i < model.length; i += 1) {
    hash = (hash * 31 + model.charCodeAt(i)) % MODEL_COLORS.length;
  }
  return MODEL_COLORS[hash];
};

const pickTags = (context = {}) => {
  if (!context.model) return '';
  const color = hashModelColor(context.model);
  return ` ${color}[${context.model}]${RESET}`;
};

const buildDetail = (level, context = {}) => {
  const { error, ...rest } = context;
  if (level === 'error' || level === 'warn') {
    return error ? ` | ${error}` : '';
  }
  if (level === 'debug') {
    const remainingKeys = Object.keys(rest).filter(
      (key) => !['model', 'sessionId', 'userId', 'characterId'].includes(key)
    );
    if (remainingKeys.length) {
      const payload = remainingKeys.reduce((acc, key) => ({ ...acc, [key]: rest[key] }), {});
      return ` | ${JSON.stringify(payload)}`;
    }
  }
  return '';
};

const logAtLevel = (level) => (message, context = {}) => {
  if (LEVELS[level] > currentLevel) {
    return;
  }
  const timestamp = new Date().toISOString();
  const color = COLORS[level] || '';
  const levelTag = `${color}[${level.toUpperCase()}]${RESET}`;
  const prefix = `[${timestamp}] ${levelTag}${pickTags(context)} ${message}`;
  const detail = buildDetail(level, context);
  if (level === 'error') {
    console.error(prefix + detail);
  } else if (level === 'warn') {
    console.warn(prefix + detail);
  } else {
    console.log(prefix + detail);
  }
};

module.exports = {
  error: logAtLevel('error'),
  warn: logAtLevel('warn'),
  info: logAtLevel('info'),
  debug: logAtLevel('debug'),
};
