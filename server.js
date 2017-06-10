var http = require('http');
var socketio = require('socket.io');
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var app = express();
var server = http.createServer(app);
var io = socketio(server);

// GLOBAL
var connectionInfo = {};

// EXPRESS
app.use(express.static(__dirname + '/client'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    'extended': 'true'
}));
app.use(bodyParser.json());
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
}));

// DATABASE

mongoose.connect('mongodb://localhost:27017/chat');

var User = mongoose.model('User', {
  login: String
});

var Message = mongoose.model('Message', {
  reciver1: String,
  reciver2: String,
  from: String,
  time: String,
  msg: String
});

// REST
app.post('/chat/login', function(req, res) {
  User.findOne({ 'login': req.body.login }, 'login', function(err, user) {
    if(err){
      console.log(err);
    } else if(user === null){
      User.create({
        login: req.body.login
      });
      res.cookie('login', req.body.login, {maxAge: 800000, httpOnly: false});
      res.end();
    } else if (req.body.login in connectionInfo){
      res.json({message: 'Login is taken'});
    } else {
      res.cookie('login', req.body.login, {maxAge: 800000, httpOnly: false});
      res.end();
    }
  });
});

app.get('/chat/:host', function(req, res) {
  res.location('/chat/' + req.params.host);
  res.sendFile('./client/list.html', {"root": __dirname});
});

app.get('/chat/list/onlineUsers/:forUser', function(req, res) {
  var onlineUsers = [];
  var activeTalk = connectionInfo[req.params.forUser].activeTalk;
  for(var key in connectionInfo){
    var isActive = false;
    for(var i = 0; i < activeTalk.length; ++i){
      if(activeTalk[i].client === key){
        isActive = true;
        break;
      }
    }
    if(key !== req.params.forUser && !isActive){
      onlineUsers.push(key);
    }
  }
  res.json(onlineUsers);
});

app.get('/chat/list/activeTalk/:forUser', function(req, res) {
  var talks = [];
  connectionInfo[req.params.forUser].activeTalk.forEach(function (talk){
    talks.push(talk.client);
  });
  res.json(talks);
});

app.get('/chat/createTalk/:host/:client', function(req, res) {
  var socket = connectionInfo[req.params.host].socket;
  connectionInfo[req.params.host].activeTalk.push({client: req.params.client});
  socket.emit('refreshOnline');
  socket.emit('refreshActive');
  res.cookie('host', req.params.host, {maxAge: 800000, httpOnly: false});
  res.cookie('client', req.params.client, {maxAge: 800000, httpOnly: false});
  res.location('/chat/' + req.params.client);
  res.sendFile('./client/talk.html', {"root": __dirname});
});

app.get('/chat/getTalk/:host/:client', function(req, res) {
  var reciver1 = req.params.client < req.params.host ? req.params.client : req.params.host;
  var reciver2 = req.params.client < req.params.host ? req.params.host : req.params.client;
  Message.find({ 'reciver1': reciver1, 'reciver2': reciver2 }, 'from time msg', function(err, talk) {
    if(err){
      console.log(err);
    } else if(talk){
      res.json(talk);
    }
    res.end();
  });
});

// SOCKET
io.on('connection', function (socket) {
    socket.on('disconnect', function () {
      if(socket.forLogin !== undefined){
        delete connectionInfo[socket.forLogin];
        for (var key in connectionInfo) {
          connectionInfo[key].socket.emit('refreshOnline');
        }
      } else if(socket.forTalk.host in connectionInfo){
        var mainSocket = connectionInfo[socket.forTalk.host].socket;
        var talkIdx = 0;
        for(var i = 0; i < connectionInfo[socket.forTalk.host].activeTalk.length; ++i){
          if(connectionInfo[socket.forTalk.host].activeTalk[i].client === socket.forTalk.client){
            talkIdx = i;
            break;
          }
        }
        connectionInfo[socket.forTalk.host].activeTalk.splice(talkIdx, 1);
        mainSocket.emit('refreshOnline');
        mainSocket.emit('refreshActive');
      }
    });

    socket.on('identify', function (login) {
      socket.forLogin = login;
      connectionInfo[login] = {};
      connectionInfo[login].activeTalk = [];
      connectionInfo[login].socket = socket;
      for (var key in connectionInfo) {
        connectionInfo[key].socket.emit('refreshOnline');
      }
      socket.emit('identifyDone');
    });

    socket.on('createTalk', function (info) {
      socket.forTalk = info;
      for(var i = 0; i < connectionInfo[info.host].activeTalk.length; ++i){
        if(connectionInfo[info.host].activeTalk[i].client === info.client){
          connectionInfo[info.host].activeTalk[i].socket = socket;
          break;
        }
      }
    });

    socket.on('send', function (msg) {
      socket.emit('reciveMsg', { msg: msg.msg, time: msg.time, from: msg.host });
      if(msg.client in connectionInfo){
        for(var i = 0; i < connectionInfo[msg.client].activeTalk.length; ++i){
          if(connectionInfo[msg.client].activeTalk[i].client === msg.host){
            connectionInfo[msg.client].activeTalk[i].socket.emit('reciveMsg', { msg: msg.msg, time: msg.time, from: msg.host });
            break;
          }
        }
      }
      var reciver1 = msg.client < msg.host ? msg.client : msg.host;
      var reciver2 = msg.client < msg.host ? msg.host : msg.client;
      Message.create({
          reciver1: reciver1,
          reciver2: reciver2,
          from: msg.host,
          time: msg.time,
          msg: msg.msg
      }, function(err, msg) {
          if (err) {
              console.log(err);
          }
      });
    });
    
});

// STARTUP
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){});

app.get('*', function(req, res) {
    res.sendFile('./client/index.html', {"root": __dirname});
});
