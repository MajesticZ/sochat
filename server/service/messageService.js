const _ = require('lodash');

// CUSTOM MODULES
const messageDao = require('../dao/messageDao');
const connectionService = require('./connectionService');

module.exports = {
  getHistory: (forUser, res) => messageDao.findForReceiver(forUser, (err, history) => {
    const historyResponse = [];
    if (err) {
      console.log(err);
    } else {
      const unreadMsg = {};
      _.each(history, (story) => {
        const client = story.reciver1 === forUser
          ? story.reciver2
          : story.reciver1;
        if (!(client in unreadMsg)) {
          unreadMsg[client] = 0;
        }
        if (story.unread && story.from !== forUser) {
          unreadMsg[client]++;
        }
      });
      _.each(unreadMsg, (unread, client) => historyResponse.push({client, unread}));
      res.json(historyResponse);
    }
    res.end();
  }),
  getTalk(forUser, withClient, res) {
    const reciver1 = withClient < forUser
      ? withClient
      : forUser;
    const reciver2 = withClient < forUser
      ? forUser
      : withClient;
    messageDao.readMessage(reciver1, reciver2, forUser, (err) => {
      if (err) {
        console.log(err);
      } else {
        messageDao.findForSpecifiedReceiver(reciver1, reciver2, (errrrrrrrr, msgs) => {
          if (errrrrrrrr) {
            console.log(errrrrrrrr);
          } else {
            res.json(msgs);
            res.end();
            connectionService.createTalkForClientWithHost(forUser, withClient);
            connectionService.emitRefreshHistoryForUser(forUser);
          }
        });
      }
    });
  },
  createMassage(host, client, from, time, msg) {
    const reciver1 = client < host
      ? client
      : host;
    const reciver2 = client < host
      ? host
      : client;
    const unread = !(connectionService.connectionWithClientExist(client))
      || (connectionService.connectionWithClientExist(client)
        && connectionService.clientDontTalkWithHost(client, host));
    messageDao.createMassage(reciver1, reciver2, host, time, msg, unread, (err) => (err ? console.log(err) : null));
  }
};
