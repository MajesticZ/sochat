const _ = require('lodash');

// CUSTOM MODULES
const socketSignal = require('../enum/socketSignal');

// MAP (login) -> (Socket)
const privateState = {};

module.exports = {
  addConnectionForUser: (login, socket) => {
    // eslint-disable-next-line no-param-reassign
    socket.forLogin = login;
    privateState[login] = socket;
  },
  removeConnectionForUser: (login) => {
    delete privateState[login];
  },
  connectionWithClientExist: (login) => _.includes(_.keys(privateState), login),
  createTalkForClientWithHost: (login, host) => {
    privateState[login].talkWith = host;
  },
  clientDontTalkWithHost: (login, host) => privateState[login].talkWith !== host,
  getOnlineUser: (login, cb) => cb(null, _.keys(_.omit(privateState, login))),
  emitMessageForHost: (host, msg) => privateState[host].emit(socketSignal.RECEIVE_MSG, {
    msg: msg.msg,
    time: msg.time,
    from: msg.host
  }),
  emitRefreshOnlineForAll: () => _.each(privateState, (socket) => socket.emit(socketSignal.REFRESH_ONLINE)),
  emitRefreshHistoryForUser: (login) => privateState[login].emit(socketSignal.REFRESH_HISTORY),
  emitSessionExpiredForUser: (login) => (privateState[login] ? privateState[login].emit(socketSignal.SESSION_EXPIRED) : null),
};
