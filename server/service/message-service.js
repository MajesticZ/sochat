var MessageDAO = null;
var MessageService = null;

module.exports = function(mongoose) {
    MessageDAO = mongoose.model('Message', {
        reciver1: String,
        reciver2: String,
        from: String,
        time: String,
        msg: String,
        readed: Boolean
    });
    MessageService = {
        getHistory: function(forUser, res) {
            Message.find({
                $and: [
                    {
                        $or: [
                            {
                                'reciver1': forUser
                            }, {
                                'reciver2': forUser
                            }
                        ]
                    }, {
                        $ne: {
                            'from': forUser
                        }
                    }
                ]
            }, function(err, history) {
                var historyResponse = [];
                if (err) {
                    console.log(err);
                } else {
                    var unreadMsg = {};
                    for (var registry in history) {
                        var client = registry.reciver1 === forUser
                            ? registry.reciver2
                            : registry.reciver1;
                        if (!(client in unreadMsg)) {
                            unreadMsg[client] = 0;
                        }
                        if(registry.unread === true){
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
        getTalk: function() {}
    }
    return MessageService;
};
