const mongoose = require('mongoose');

// MONGO SETUP
// mongoose.set('debug', true);
mongoose.set('debug', false);

module.exports = mongoose.connect('mongodb://localhost/chat');
