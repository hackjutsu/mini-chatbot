module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/**/*.test.js'],
  collectCoverageFrom: ['server/**/*.js', '!server/**/*.test.js'],
  clearMocks: true,
};
