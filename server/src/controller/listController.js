const async = require('async');

// CUSTOM MODULES
const connectionService = require('../service/connectionService');
const messageService = require('../service/messageService');
const callbackFinalizer = require('../util/callbackFinalizer');

module.exports = {
  onlineUsersForUserWithToken,
  historyForUserWithToken,
  historyForUserWithHostWithToken
};

function onlineUsersForUserWithToken(req, res) {
  async.waterfall([
    (cb) => connectionService.getOnlineUser(req.params.forUser, cb)
  ], (err, users) => callbackFinalizer.finalizeRequest(err || users, res));
}

function historyForUserWithToken(req, res) {
  async.waterfall([
    (cb) => messageService.getHistory(req.params.forUser, cb)
  ], (err, history) => callbackFinalizer.finalizeRequest(err || history, res));
}

function historyForUserWithHostWithToken(req, res) {
  async.waterfall([
    (cb) => messageService.getTalk(req.params.forUser, req.params.withClient, cb)
  ], (err, talk) => callbackFinalizer.finalizeRequest(err || talk, res));
}
