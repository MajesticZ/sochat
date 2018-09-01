const crypto = require('crypto');
const moment = require('moment');
const uuidV1 = require('uuid/v1');

// CUSTOM MODULES
const userDao = require('../dao/userDao');
const connectionService = require('./connectionService');
const cookieService = require('./cookieService');
const errorMessage = require('../enum/errorMessages');
const callbackFinalizer = require('../util/callbackFinalizer');

const TokenTimeout = 800000;

module.exports = {
  signIn: (login, password, res) => userDao.findByLogin(login, (err, user) => {
    if (err) {
      return callbackFinalizer.finalizeRequest(errorMessage.server.somethingWrong, res);
    } if (user === null) {
      return callbackFinalizer.finalizeRequest(errorMessage.user.dontExist, res);
    } if (connectionService.connectionWithClientExist(login) || (user.token !== '' && user.tokenExpiredTime > new Date())) {
      return callbackFinalizer.finalizeRequest(errorMessage.user.alreadySignIn, res);
    } if (crypto.createHmac('sha256', password).digest('hex') !== user.password) {
      return callbackFinalizer.finalizeRequest(errorMessage.user.wrongPassword, res);
    }
    module.exports.createTokenAndResponse(user, res);
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
      return callbackFinalizer.finalizeRequest(errorMessage.server.somethingWrong, res);
    } if (user !== null) {
      return callbackFinalizer.finalizeRequest(errorMessage.user.alreadyExist, res);
    }
    module.exports.createUserAndResponse(login, password, res);

  }),
  createTokenAndResponse: (user, res) => {
    const token = uuidV1();
    userDao.createToken(user.id, token, moment().add(TokenTimeout, 'ms'), (err) => {
      if (err) {
        return callbackFinalizer.finalizeRequest(errorMessage.server.somethingWrong, res);
      }
      cookieService.addSessionCookie(user.login, token, res);
      res.end();
    });
  },
  createUserAndResponse: (login, password, res) => {
    const token = uuidV1();
    const hash = crypto.createHmac('sha256', password).digest('hex');
    const timeout = moment().add(TokenTimeout, 'ms');
    userDao.createUser(login, hash, token, timeout, (err) => {
      if (err) {
        return callbackFinalizer.finalizeRequest(errorMessage.server.somethingWrong, res);
      }
      cookieService.addSessionCookie(login, token, res);
      res.end();
    });
  },
  checkToken: (login, token, res, successCb, failureCb) => userDao.findByLoginAndToken(login, token, (err, user) => {
    if (err) {
      console.log(err);
      return failureCb();
    } if (user === null || user.tokenExpiredTime < new Date()) {
      return failureCb();
    }
    module.exports.refreshToken(login);
    cookieService.addSessionCookie(login, token, res);
    successCb();

  }),
  refreshToken: (login) => userDao.refreshToken(login, moment().add(TokenTimeout, 'ms'), (err) => (err ? console.log(err) : null))
};
