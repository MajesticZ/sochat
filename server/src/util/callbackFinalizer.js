const util = require('util');
const _ = require('lodash');

module.exports.finalizeRequest = (result, res, httpStatus) => {
  const endStatus = httpStatus || (result && result.error ? 400 : 200);

  if (result) {
    if ((_.isArray(result) && result.length) || !_.isArray(result)) {
      console.log(util.inspect(result));
    }
    return res.status(endStatus).json(result);
  }
  return res.status(endStatus).end();
};
