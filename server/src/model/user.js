const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  login: String,
  password: String,
  token: String,
  tokenExpiredTime: Date
});

module.exports = mongoose.model('User', userSchema);
