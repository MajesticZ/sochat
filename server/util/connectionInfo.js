const connections = {};

module.exports = {
    connections: connections,
    getOnlineUser: function(login, res) {
      const onlineUsers = [];
      for (let key in connections) {
            if (key !== login) {
                onlineUsers.push(key);
            }
        }
        res.json(onlineUsers);
    }
};
