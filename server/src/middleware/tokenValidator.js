// CUSTOM MODULES
const cookieController = require('../controller/cookieController');
const userService = require('../service/userService');
const connectionService = require('../service/connectionService');
const userDao = require('../dao/userDao');
const callbackFinalizer = require('../util/callbackFinalizer');

module.exports = {
  checkToken
};


function checkToken(req, res, next) {
  const login = req.params.forUser || req.cookies.login;
  const token = req.params.withToken || req.cookies.token;
  userDao.findByLoginAndToken(login, token, (err, user) => {
    if (err) {
      console.log(err);
      return endSessionWithClient(req, res, login);
    }
    if (user === null || user.tokenExpiredTime < new Date()) {
      return endSessionWithClient(req, res, login);
    }
    userService.refreshToken(login);
    cookieController.addSessionCookie(login, token, res);
    return next();
  });
}

function endSessionWithClient(req, res, login) {
  if (connectionService.connectionWithClientExist(login)) {
    connectionService.emitSessionExpiredForUser(login);
    return callbackFinalizer.finalizeRequest(null, res);
  }
  res.location('/');
  return res.sendFile(req.finalUrls.failure, req.finalUrls.root);
}
