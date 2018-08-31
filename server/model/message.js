const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  reciver1: String,
  reciver2: String,
  from: String,
  time: String,
  msg: String,
  unread: Boolean
});

module.exports = mongoose.model('Message', messageSchema);
