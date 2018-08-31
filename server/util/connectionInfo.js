const _ = require('lodash');

module.exports = {
  connections: {},
  getOnlineUser: (login, res) => res.json(_.keys(_.omit(module.exports.connections, login)))
};
