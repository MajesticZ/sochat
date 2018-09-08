const crypto = require('crypto');
const moment = require('moment');
const uuidV1 = require('uuid/v1');

// CUSTOM MODULES
const userDao = require('../dao/userDao');
const connectionService = require('./connectionService');

module.exports = {
  checkUserIsAlreadySignIn,
  createTokenForUser,
  checkPassword,
  createUser,
  refreshToken,
  findByLogin: userDao.findByLogin,
};

const TokenTimeout = 800000;

function checkPassword(requestPassword, dbPassword) {
  return crypto.createHmac('sha256', requestPassword).digest('hex') === dbPassword;
}

function checkUserIsAlreadySignIn(login, user) {
  return connectionService.connectionWithClientExist(login) || (user.token !== '' && user.tokenExpiredTime > new Date());
}

function createTokenForUser(user, cb) {
  const token = uuidV1();
  const timeout = moment().add(TokenTimeout, 'ms');
  return userDao.createToken(user.id, token, timeout, (err) => cb(err, user, token));
}

function createUser(login, password, cb) {
  const token = uuidV1();
  const hash = crypto.createHmac('sha256', password).digest('hex');
  const timeout = moment().add(TokenTimeout, 'ms');
  return userDao.createUser(login, hash, token, timeout, (err) => cb(err, login, token));
}

function refreshToken(login) {
  return userDao.refreshToken(login, moment().add(TokenTimeout, 'ms'), (err) => (err ? console.log(err) : null));
}
