const _ = require('lodash');

module.exports = () => (req, res, next) => {
  _.map(req.cookies, (cookie) => (cookie === 'undefined' ? undefined : cookie));
  return next();
};
