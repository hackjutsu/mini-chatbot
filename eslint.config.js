const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['client/**', 'node_modules/**', 'local_assets/**', 'public/**', 'data/**'],
  },
  {
    files: ['*.js', 'server/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off',
    },
  },
  {
    files: ['db.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off',
    },
  },
];
