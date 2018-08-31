const crypto = require('crypto');
const moment = require('moment');
const uuidV1 = require('uuid/v1');

// CUSTOM MODULES
const userDao = require('../dao/userDao');
const connectionService = require('./connectionService');
const errorMessage = require('../util/errorMessages');

const TokenTimeout = 800000;

module.exports = {
  signIn: (login, password, res) => userDao.findByLogin(login, (err, user) => {
    if (err) {
      errorMessage.response(res, errorMessage.somethingWrong);
    } else if (user === null) {
      errorMessage.response(res, errorMessage.userDontExist);
    } else if (connectionService.connectionWithClientExist(login) || (user.token !== '' && user.tokenExpiredTime > new Date())) {
      errorMessage.response(res, errorMessage.userAlreadySignin);
    } else if (crypto.createHmac('sha256', password).digest('hex') !== user.password) {
      errorMessage.response(res, errorMessage.wrongPassword);
    } else {
      module.exports.createTokenAndResponse(user, res);
    }
  }),
  signInWithToken: (login, token, urls, res) => module.exports.checkToken(login, token, res, () => {
    res.location('/chat/');
    res.sendFile(urls.success, urls.root);
  }, () => {
    res.location('/');
    res.sendFile(urls.failure, urls.root);
  }),
  signUp: (login, password, res) => userDao.findByLogin(login, (err, user) => {
    if (err) {
      errorMessage.response(res, errorMessage.somethingWrong);
    } else if (user !== null) {
      errorMessage.response(res, errorMessage.userAlreadyExist);
    } else {
      module.exports.createUserAndResponse(login, password, res);
    }
  }),
  createTokenAndResponse: (user, res) => {
    const token = uuidV1();
    userDao.createToken(user.id, token, moment().add(TokenTimeout, 'ms'), (err) => {
      if (err) {
        console.log(err);
        errorMessage.response(res, errorMessage.somethingWrong);
      } else {
        module.exports.addSessionCookie(user.login, token, res);
        res.end();
      }
    });
  },
  createUserAndResponse: (login, password, res) => {
    const token = uuidV1();
    const hash = crypto.createHmac('sha256', password).digest('hex');
    const timeout = moment().add(TokenTimeout, 'ms');
    userDao.createUser(login, hash, token, timeout, (err) => {
      if (err) {
        console.log(err);
        errorMessage.response(res, errorMessage.somethingWrong);
      } else {
        module.exports.addSessionCookie(login, token, res);
        res.end();
      }
    });
  },
  addSessionCookie: (login, token, res) => {
    res.cookie('login', login, {
      maxAge: TokenTimeout,
      httpOnly: false
    });
    res.cookie('token', token, {
      maxAge: TokenTimeout,
      httpOnly: false
    });
  },
  checkToken: (login, token, res, successCb, failureCb) => userDao.findByLoginAndToken(login, token, (err, user) => {
    if (err) {
      console.log(err);
      failureCb();
    } else if (user === null || user.tokenExpiredTime < new Date()) {
      failureCb();
    } else {
      module.exports.refreshToken(login);
      module.exports.addSessionCookie(login, token, res);
      successCb();
    }
  }),
  refreshToken: (login) => userDao.refreshToken(login, moment().add(TokenTimeout, 'ms'), (err) => (err ? console.log(err) : null))
};
