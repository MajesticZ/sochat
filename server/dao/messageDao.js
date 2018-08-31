// CUSTOM MODULES
const messageModel = require('../model/message');

module.exports = {
  findForReceiver: (forUser, cb) => messageModel.find({
    $and: [
      {
        $or: [
          {
            reciver1: forUser
          }, {
            reciver2: forUser
          }
        ]
      }
    ]
  }, cb),
  findForSpecifiedReceiver: (reciver1, reciver2, cb) => {
    messageModel.find({
      reciver1,
      reciver2
    }, 'msg time from', cb);
  },
  readMessage: (reciver1, reciver2, forUser, cb) => {
    messageModel.update({
      reciver1,
      reciver2,
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
  createMassage(reciver1, reciver2, host, time, msg, unread) {
    messageModel.create({
      reciver1,
      reciver2,
      from: host,
      time,
      msg,
      unread
    }, (err) => (err ? console.log(err) : null));
  }
};
