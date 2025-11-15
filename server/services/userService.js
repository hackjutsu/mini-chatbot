const {
  getUserById: dbGetUserById,
  getUserByUsername: dbGetUserByUsername,
  createUser,
  setUserPreferredModel,
} = require('../../db');

const getById = (userId) => dbGetUserById(userId) || null;

const getByUsername = (username) => dbGetUserByUsername(username) || null;

const setPreferredModel = (userId, model) => setUserPreferredModel(userId, model);

module.exports = {
  getById,
  getByUsername,
  createUser,
  setPreferredModel,
};
