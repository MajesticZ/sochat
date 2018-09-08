const async = require('async');

// CUSTOM MODULES
const userService = require('../service/userService');
const cookieController = require('./cookieController');
const errorMessage = require('../enum/errorMessages');
const tokenValidator = require('../middleware/tokenValidator');
const callbackFinalizer = require('../util/callbackFinalizer');

module.exports = {
  signIn,
  signInWithToken,
  signUp
};

function signIn(req, res) {
  async.waterfall([
    (cb) => userService.findByLogin(req.body.login, cb),
    (user, cb) => {
      if (!user) {
        return cb(errorMessage.user.dontExist);
      }
      if (userService.checkUserIsAlreadySignIn(req.body.login, user)) {
        return cb(errorMessage.user.alreadySignIn);
      }
      if (!userService.checkPassword(req.body.password, user.password)) {
        return cb(errorMessage.user.wrongPassword);
      }
      return cb(null, user);
    },
    (user, cb) => userService.createTokenForUser(user, cb)
  ], (err, user, token) => {
    cookieController.addSessionCookie(user.login, token, res);
    callbackFinalizer.finalizeRequest(err, res);
  });
}

function signInWithToken(req, res) {
  tokenValidator.checkToken(req, res, () => {
    res.location('/chat/');
    res.sendFile(req.finalUrls.success, req.finalUrls.root);
  });
}

function signUp(req, res) {
  async.waterfall([
    (cb) => userService.findByLogin(req.body.login, cb),
    (user, cb) => (user ? cb(errorMessage.user.alreadyExist) : cb(null, user)),
    (user, cb) => userService.createUser(req.body.login, req.body.password, cb)
  ], (err, login, token) => {
    cookieController.addSessionCookie(login, token, res);
    callbackFinalizer.finalizeRequest(err, res);
  });
}
