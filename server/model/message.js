const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  reciver1: String,
  reciver2: String,
  from: String,
  time: String,
  msg: String,
  unread: Boolean
});

module.exports = mongoose.model('Message', messageSchema);
