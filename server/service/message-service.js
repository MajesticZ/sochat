// CUSTOM MODULES
const ConnectionInfo = require('../util/connection-info.js');

var MessageDAO = null;
var MessageService = null;

module.exports = function(mongoose) {
    MessageDAO = mongoose.model('Message', {
        reciver1: String,
        reciver2: String,
        from: String,
        time: String,
        msg: String,
        unread: Boolean
    });
    MessageService = {
        getHistory: function(forUser, res) {
            MessageDAO.find({
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
                var historyResponse = [];
                if (err) {
                    console.log(err);
                } else {
                    var unreadMsg = {};
                    for (var i in history) {
                        var client = history[i].reciver1 === forUser
                            ? history[i].reciver2
                            : history[i].reciver1;
                        if (!(client in unreadMsg)) {
                            unreadMsg[client] = 0;
                        }
                        if (history[i].unread && history[i].from !== forUser) {
                            unreadMsg[client]++;
                        }
                    }
                    for (var client in unreadMsg) {
                        historyResponse.push({client: client, unread: unreadMsg[client]});
                    }
                    res.json(historyResponse);
                }
                res.end();
            });
        },
        getTalk: function(forUser, withClient, res) {
            var reciver1 = withClient < forUser
                ? withClient
                : forUser;
            var reciver2 = withClient < forUser
                ? forUser
                : withClient;
            MessageDAO.update({
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
            }, function(err, updated) {
                if (err) {
                    console.log(err);
                } else {
                    MessageDAO.find({
                        'reciver1': reciver1,
                        'reciver2': reciver2
                    }, 'msg time from', function(err, msgs) {
                        if (err) {
                            console.log(err);
                        } else {
                            res.json(msgs);
                            res.end();
                            ConnectionInfo.connections[forUser].talkWith = withClient;
                            ConnectionInfo.connections[forUser].emit('refreshHistory');
                        }
                    });
                }
            });
        },
        createMassage: function(host, client, from, time, msg) {
            var reciver1 = client < host
                ? client
                : host;
            var reciver2 = client < host
                ? host
                : client;
            MessageDAO.create({
                reciver1: reciver1,
                reciver2: reciver2,
                from: host,
                time: time,
                msg: msg,
                unread: !(client in ConnectionInfo.connections) || (client in ConnectionInfo.connections && ConnectionInfo.connections[client].talkWith !== host)
            }, function(err, msg) {
                if (err) {
                    console.log(err);
                }
            });
        }
    }
    return MessageService;
};
