// CUSTOM MODULES
const messageModel = require('../model/message');
const connectionInfo = require('../util/connectionInfo');

module.exports = {
    getHistory: function(forUser, res) {
        messageModel.find({
            $and: [
                {
                    $or: [
                        {
                            'reciver1': forUser
                        }, {
                            'reciver2': forUser
                        }
                    ]
                }
            ]
        }, function(err, history) {
          const historyResponse = [];
          if (err) {
                console.log(err);
            } else {
              const unreadMsg = {};
              for (let i in history) {
                    const client = history[i].reciver1 === forUser
                        ? history[i].reciver2
                        : history[i].reciver1;
                    if (!(client in unreadMsg)) {
                        unreadMsg[client] = 0;
                    }
                    if (history[i].unread && history[i].from !== forUser) {
                        unreadMsg[client]++;
                    }
                }
                for (let client in unreadMsg) {
                    historyResponse.push({client: client, unread: unreadMsg[client]});
                }
                res.json(historyResponse);
            }
            res.end();
        });
    },
    getTalk: function(forUser, withClient, res) {
      const reciver1 = withClient < forUser
        ? withClient
        : forUser;
      const reciver2 = withClient < forUser
        ? forUser
        : withClient;
      messageModel.update({
            'reciver1': reciver1,
            'reciver2': reciver2,
            'from': {
                $ne: forUser
            },
            'unread': true
        }, {
            $set: {
                'unread': false
            }
        }, {
            multi: true
        }, function(err) {
            if (err) {
                console.log(err);
            } else {
                messageModel.find({
                    'reciver1': reciver1,
                    'reciver2': reciver2
                }, 'msg time from', function(err, msgs) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.json(msgs);
                        res.end();
                        connectionInfo.connections[forUser].talkWith = withClient;
                        connectionInfo.connections[forUser].emit('refreshHistory');
                    }
                });
            }
        });
    },
    createMassage: function(host, client, from, time, msg) {
      const reciver1 = client < host
        ? client
        : host;
      const reciver2 = client < host
        ? host
        : client;
      messageModel.create({
            reciver1: reciver1,
            reciver2: reciver2,
            from: host,
            time: time,
            msg: msg,
            unread: !(client in connectionInfo.connections) || (client in connectionInfo.connections && connectionInfo.connections[client].talkWith !== host)
        }, function(err) {
            if (err) {
                console.log(err);
            }
        });
    }
};
