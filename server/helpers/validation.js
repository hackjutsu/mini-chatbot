const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

const isValidUsername = (username = '') => USERNAME_PATTERN.test(username.trim());

module.exports = {
  USERNAME_PATTERN,
  isValidUsername,
};
