// CUSTOM MODULES
const messageModel = require('../model/message');

module.exports = {
  findForReceiver: (forUser, cb) => messageModel.find({
    $or: [
      {
        receiver1: forUser
      }, {
        receiver2: forUser
      }
    ]
  }, cb),
  findForSpecifiedReceiver: (receiver1, receiver2, cb) => {
    messageModel.find({
      receiver1,
      receiver2
    }, 'msg time from', cb);
  },
  readMessage: (receiver1, receiver2, forUser, cb) => {
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
  },
  createMassage: (receiver1, receiver2, host, time, msg, unread, cb) => messageModel.create({
    receiver1,
    receiver2,
    from: host,
    time,
    msg,
    unread
  }, cb)
};
