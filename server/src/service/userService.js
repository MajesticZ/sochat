const crypto = require('crypto');
const moment = require('moment');
const uuidV1 = require('uuid/v1');

// CUSTOM MODULES
const userDao = require('../dao/userDao');
const connectionService = require('./connectionService');

const TokenTimeout = 800000;

module.exports = {
  checkPassword: (requestPassword, dbPassword) => crypto.createHmac('sha256', requestPassword).digest('hex') === dbPassword,
  checkUserIsAlreadySignIn: (login, user) => connectionService.connectionWithClientExist(login) || (user.token !== '' && user.tokenExpiredTime > new Date()),
  createTokenForUser: (user, cb) => {
    const token = uuidV1();
    userDao.createToken(user.id, token, moment().add(TokenTimeout, 'ms'), (err) => cb(err, user, token));
  },
  createUser: (login, password, cb) => {
    const token = uuidV1();
    const hash = crypto.createHmac('sha256', password).digest('hex');
    const timeout = moment().add(TokenTimeout, 'ms');
    userDao.createUser(login, hash, token, timeout, (err) => cb(err, login, token));
  },
  refreshToken: (login) => userDao.refreshToken(login, moment().add(TokenTimeout, 'ms'), (err) => (err ? console.log(err) : null)),
  findByLogin: userDao.findByLogin,
};
