const mongoose = require('mongoose');

// MONGO SETUP
mongoose.set('debug', true);

module.exports = mongoose.connect('mongodb://localhost/chat');