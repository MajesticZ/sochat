// CUSTOM MODULES
const userModel = require('../model/user');

module.exports = {
  findByLogin,
  findByLoginAndToken,
  createToken,
  refreshToken,
  createUser
};

function findByLogin(login, cb) {
  userModel.findOne({login}, 'login password token tokenExpiredTime', cb);
}

function findByLoginAndToken(login, token, cb) {
  userModel.findOne({
    login,
    token
  }, 'login tokenExpiredTime', cb);
}

function createToken(id, token, timeout, cb) {
  userModel.update({
    _id: id
  }, {
    $set: {
      token,
      tokenExpiredTime: timeout
    }
  }, cb);
}

function refreshToken(login, newTimeout, cb) {
  userModel.update({
    login
  }, {
    $set: {
      tokenExpiredTime: newTimeout
    }
  }, cb);
}

function createUser(login, passwordHash, token, timeout, cb) {
  userModel.create({
    login,
    password: passwordHash,
    token,
    tokenExpiredTime: timeout
  }, cb);
}
