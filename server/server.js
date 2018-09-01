const https = require('https');
const fs = require('fs');
const socketio = require('socket.io');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// CUSTOM MODULES
const socketSignal = require('./enum/socketSignal');
const connectionService = require('./service/connectionService');
const userRouter = require('./router/user');
const listRouter = require('./router/list');
const userService = require('./service/userService');
const messageService = require('./service/messageService');

// MONGO SETUP
require('./db/mongooseConnection');

// GLOBAL
const options = {
  key: fs.readFileSync('../ssl/key.pem'),
  cert: fs.readFileSync('../ssl/cert.pem')
};

const app = express();
const server = https.createServer(options, app);
const io = socketio(server);

// EXPRESS SETUP
app.use(express.static(`${__dirname}/../client/public`));
// app.use(morgan('dev'));
app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: 'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));


// ROUTING
app.use('/chat/user', userRouter);
app.use('/chat/list', listRouter);

// SOCKET.IO
io.on('connection', (socket) => {
  socket.on(socketSignal.DISCONNECT, () => {
    socket.broadcast.emit(socketSignal.REFRESH_ONLINE);
    connectionService.removeConnectionForUser(socket.forLogin);
  });

  socket.on(socketSignal.IDENTIFY, (login) => {
    if (login) {
      connectionService.addConnectionForUser(login, socket);
      connectionService.emitRefreshOnlineForAll();
      socket.emit(socketSignal.REFRESH_HISTORY);
    } else {
      socket.emit(socketSignal.SESSION_EXPIRED);
    }
  });

  socket.on(socketSignal.SEND, (msg) => {
    messageService.createMassage(msg.host, msg.client, msg.host, msg.time, msg.msg);
    socket.emit(socketSignal.RECEIVE_MSG, {
      msg: msg.msg,
      time: msg.time,
      from: msg.host
    });
    if (connectionService.connectionWithClientExist(msg.client)) {
      if (connectionService.clientDontTalkWithHost(msg.client, msg.host)) {
        connectionService.emitRefreshHistoryForUser(msg.client);
      } else {
        connectionService.emitMessageForHost(msg.client, msg);
      }
    }
  });

});

// SERVE FRONTEND
app.get('*', (req, res) => {
  if (req.cookies && req.cookies.login && req.cookies.token) {
    userService.signInWithToken(req.cookies.login, req.cookies.token, {
      failure: './client/index.html',
      success: './client/chat.html',
      root: {
        root: `${__dirname}/..`
      }
    }, res);
  } else {
    res.location('/');
    res.sendFile('./client/index.html', {root: `${__dirname}/..`});
  }
});

// STARTUP
server.listen(8443, (err) => {
  if (err) {
    console.log(err);
    throw err;
  }
  console.log(`Server listen on https://localhost:${server.address().port}`);
});
