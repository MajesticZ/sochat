const https = require('https');
const fs = require('fs');
const socketio = require('socket.io');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const _ = require('lodash');

// CUSTOM MODULES
const connectionInfo = require('./server/util/connectionInfo');
const userService = require('./server/service/userService');
const messageService = require('./server/service/messageService');

// MONGO SETUP
require('./server/db/mongooseConnection');

// GLOBAL
const options = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem')
};

const app = express();
const server = https.createServer(options, app);
const io = socketio(server);

// EXPRESS SETUP
app.use(express.static(`${__dirname}/client/public`));
// app.use(morgan('dev'));
app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: 'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));


// ROUTING
app.post('/chat/signin', (req, res) => {
  userService.signIn(req.body.login, req.body.password, res);
});

app.post('/chat/signup', (req, res) => {
  userService.signUp(req.body.login, req.body.password, res);
});

app.get('/chat/list/onlineUsers/:forUser/:withToken', (req, res) => {
  userService.checkToken(req.params.forUser, req.params.withToken, res, () => {
    connectionInfo.getOnlineUser(req.params.forUser, res);
  }, () => {
    connectionInfo.connections[req.params.forUser].emit('sessionExpired');
  });
});

app.get('/chat/history/:forUser/:withToken', (req, res) => {
  userService.checkToken(req.params.forUser, req.params.withToken, res, () => {
    messageService.getHistory(req.params.forUser, res);
  }, () => {
    connectionInfo.connections[req.params.forUser].emit('sessionExpired');
  });
});

app.get('/chat/history/:forUser/:withToken/:withClient', (req, res) => {
  userService.checkToken(req.params.forUser, req.params.withToken, res, () => {
    messageService.getTalk(req.params.forUser, req.params.withClient, res);
  }, () => {
    connectionInfo.connections[req.params.forUser].emit('sessionExpired');
  });
});

// SOCKET.IO
io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    socket.broadcast.emit('refreshOnline');
    delete connectionInfo.connections[socket.forLogin];
  });

  socket.on('identify', (login) => {
    if (login) {
      // eslint-disable-next-line no-param-reassign
      socket.forLogin = login;
      connectionInfo.connections[login] = socket;
      socket.emit('refreshHistory');
      _.each(connectionInfo.connections, (otherSocket) => otherSocket.emit('refreshOnline'));
    } else {
      socket.emit('sessionExpired');
    }
  });

  socket.on('send', (msg) => {
    messageService.createMassage(msg.host, msg.client, msg.host, msg.time, msg.msg);
    socket.emit('reciveMsg', {
      msg: msg.msg,
      time: msg.time,
      from: msg.host
    });
    if (msg.client in connectionInfo.connections) {
      if (connectionInfo.connections[msg.client].talkWith !== msg.host) {
        connectionInfo.connections[msg.client].emit('refreshHistory');
      } else {
        connectionInfo.connections[msg.client].emit('reciveMsg', {
          msg: msg.msg,
          time: msg.time,
          from: msg.host
        });
      }
    }
  });

});

// STARTUP
app.get('*', (req, res) => {
  if (req.cookies && req.cookies.login && req.cookies.token) {
    userService.signInWithToken(req.cookies.login, req.cookies.token, {
      failure: './client/index.html',
      success: './client/chat.html',
      root: {
        root: __dirname
      }
    }, res);
  } else {
    res.location('/');
    res.sendFile('./client/index.html', {root: __dirname});
  }
});
server.listen(8443, (err) => {
  if (err) {
    console.log(err);
    throw err;
  }
  console.log(`Server listen on https://localhost:${server.address().port}`);
});
