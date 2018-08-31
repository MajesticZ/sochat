const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  login: String,
  password: String,
  token: String,
  tokenExpiredTime: Date
});

module.exports = mongoose.model('User', userSchema);
