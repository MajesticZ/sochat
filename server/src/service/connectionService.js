const _ = require('lodash');

// CUSTOM MODULES
const socketSignal = require('../enum/socketSignal');

// MAP (login) -> (Socket)
const privateState = {};

module.exports = {
  addConnectionForUser,
  removeConnectionForUser,
  connectionWithClientExist,
  createTalkForClientWithHost,
  clientDontTalkWithHost,
  getOnlineUser,
  emitMessageForHost,
  emitRefreshOnlineForAll,
  emitRefreshHistoryForUser,
  emitSessionExpiredForUser
};
function addConnectionForUser(login, socket) {
  // eslint-disable-next-line no-param-reassign
  socket.forLogin = login;
  privateState[login] = socket;
}

function removeConnectionForUser(login) {
  delete privateState[login];
}

function connectionWithClientExist(login) {
  return _.includes(_.keys(privateState), login);
}

function createTalkForClientWithHost(login, host) {
  privateState[login].talkWith = host;
}

function clientDontTalkWithHost(login, host) {
  return privateState[login].talkWith !== host;
}

function getOnlineUser(login, cb) {
  return cb(null, _.keys(_.omit(privateState, login)));
}

function emitMessageForHost(host, msg) {
  privateState[host].emit(socketSignal.RECEIVE_MSG, {
    msg: msg.msg,
    time: msg.time,
    from: msg.host
  });
}

function emitRefreshOnlineForAll() {
  _.each(privateState, (socket) => socket.emit(socketSignal.REFRESH_ONLINE));
}

function emitRefreshHistoryForUser(login) {
  privateState[login].emit(socketSignal.REFRESH_HISTORY);
}

function emitSessionExpiredForUser(login) {
  (privateState[login] ? privateState[login].emit(socketSignal.SESSION_EXPIRED) : null);
}
