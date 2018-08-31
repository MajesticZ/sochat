const _ = require('lodash');

// CUSTOM MODULES
const messageDao = require('../dao/messageDao');
const connectionInfo = require('../util/connectionInfo');

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
      }
      messageDao.findForSpecifiedReceiver(reciver1, reciver2, (errrrrrrrr, msgs) => {
        if (errrrrrrrr) {
          console.log(errrrrrrrr);
        }
        res.json(msgs);
        res.end();
        connectionInfo.connections[forUser].talkWith = withClient;
        connectionInfo.connections[forUser].emit('refreshHistory');
      });
    });
  },
  createMassage(host, client, from, time, msg) {
    const reciver1 = client < host
      ? client
      : host;
    const reciver2 = client < host
      ? host
      : client;
    const unread = !(client in connectionInfo.connections) || (client in connectionInfo.connections && connectionInfo.connections[client].talkWith !== host);
    messageDao.createMassage(reciver1, reciver2, host, time, msg, unread);
  }
};
