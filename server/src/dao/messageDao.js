// CUSTOM MODULES
const messageModel = require('../model/message');

function findForReceiver(forUser, cb) {
  messageModel.find({
    $or: [
      {
        receiver1: forUser
      }, {
        receiver2: forUser
      }
    ]
  }, cb);
}

function findForSpecifiedReceiver(receiver1, receiver2, cb) {
  messageModel.find({
    receiver1,
    receiver2
  }, 'msg time from', cb);
}

function readMessage(receiver1, receiver2, forUser, cb) {
  messageModel.update({
    receiver1,
    receiver2,
    from: {
      $ne: forUser
    },
    unread: true
  }, {
    $set: {
      unread: false
    }
  }, {
    multi: true
  }, cb);
}

function createMassage(receiver1, receiver2, host, time, msg, unread, cb) {
  messageModel.create({
    receiver1,
    receiver2,
    from: host,
    time,
    msg,
    unread
  }, cb);
}

module.exports = {
  findForReceiver,
  findForSpecifiedReceiver,
  readMessage,
  createMassage
};
