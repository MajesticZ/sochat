const _ = require('lodash');

// CUSTOM MODULES
const messageDao = require('../dao/messageDao');
const connectionService = require('./connectionService');

module.exports = {
  getHistory: (forUser, cb) => messageDao.findForReceiver(forUser, (err, history) => {
    const historyWithCountedUnreadMessage = [];
    if (err) {
      console.log(err);
      return cb(err);
    }
    const unreadMsg = {};
    _.each(history, (story) => {
      const client = story.receiver1 === forUser
        ? story.receiver2
        : story.receiver1;
      if (!(client in unreadMsg)) {
        unreadMsg[client] = 0;
      }
      if (story.unread && story.from !== forUser) {
        unreadMsg[client]++;
      }
    });
    _.each(unreadMsg, (unread, client) => historyWithCountedUnreadMessage.push({client, unread}));
    return cb(null, historyWithCountedUnreadMessage);
  }),
  getTalk: (forUser, withClient, cb) => {
    const receiver1 = withClient < forUser
      ? withClient
      : forUser;
    const receiver2 = withClient < forUser
      ? forUser
      : withClient;
    module.exports.readAllMessageBetweenReceiver(receiver1, receiver2, forUser, (outerErr) => messageDao.findForSpecifiedReceiver(receiver1, receiver2, (err, messages) => {
      if (outerErr || err) {
        return cb(outerErr || err);
      }
      connectionService.createTalkForClientWithHost(forUser, withClient);
      connectionService.emitRefreshHistoryForUser(forUser);
      return cb(null, messages);
    }));
  },
  readAllMessageBetweenReceiver: (receiver1, receiver2, forUser, cb) => messageDao.readMessage(receiver1, receiver2, forUser, (err) => err ? console.log(err) : cb(null)),
  createMassage(host, client, from, time, msg) {
    const receiver1 = client < host
      ? client
      : host;
    const receiver2 = client < host
      ? host
      : client;
    const unread = !(connectionService.connectionWithClientExist(client))
      || (connectionService.connectionWithClientExist(client)
        && connectionService.clientDontTalkWithHost(client, host));
    messageDao.createMassage(receiver1, receiver2, host, time, msg, unread, (err) => (err ? console.log(err) : null));
  }
};
