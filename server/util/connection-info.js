var connections = {};

module.exports = {
    connections: connections,
    getOnlineUser: function(login, res) {
        var onlineUsers = [];
        for (var key in connections) {
            if (key !== login) {
                onlineUsers.push(key);
            }
        }
        res.json(onlineUsers);
    }
};
