const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  receiver1: String,
  receiver2: String,
  from: String,
  time: String,
  msg: String,
  unread: Boolean
});

module.exports = mongoose.model('Message', messageSchema);
