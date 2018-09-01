const util = require('util');

module.exports.finalizeRequest = (result, res, httpStatus) => {
  const endStatus = httpStatus || (result && result.error ? 400 : 200);
  console.log(util.inspect(result));

  if (result) {
    return res.status(endStatus).json(result);
  }
  return res.status(endStatus).end();
};
