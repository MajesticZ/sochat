const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// CUSTOM MODULES
const ConnectionInfo = require('./server/util/connection-info.js');
const ErrorMessage = require('./server/util/error-messages.js');
const UserService = require('./server/service/user-service.js')(mongoose);

// GLOBAL
var app = express();
var server = http.createServer(app);
var io = socketio(server);

// EXPRESS SETUP
app.use(express.static(__dirname + '/client'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({'extended': 'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));

// MONGO SETUP
mongoose.connect('mongodb://localhost:27017/chat');

var Message = mongoose.model('Message', {
    reciver1: String,
    reciver2: String,
    from: String,
    time: String,
    msg: String
});

// ROUTING
app.post('/chat/signin', function(req, res) {
    UserService.signIn(req.body.login, req.body.password, res);
});

app.post('/chat/signup', function(req, res) {
    UserService.signUp(req.body.login, req.body.password, res);
});


app.get('/chat/:host', function(req, res) {
    res.location('/chat/' + req.params.host);
    res.sendFile('./client/list.html', {"root": __dirname});
});

app.get('/chat/list/onlineUsers/:forUser', function(req, res) {
    var onlineUsers = [];
    var activeTalk = ConnectionInfo.connections[req.params.forUser].activeTalk;
    for (var key in ConnectionInfo.connections) {
        var isActive = false;
        for (var i = 0; i < activeTalk.length; ++i) {
            if (activeTalk[i].client === key) {
                isActive = true;
                break;
            }
        }
        if (key !== req.params.forUser && !isActive) {
            onlineUsers.push(key);
        }
    }
    res.json(onlineUsers);
});

app.get('/chat/list/activeTalk/:forUser', function(req, res) {
    var talks = [];
    ConnectionInfo.connections[req.params.forUser].activeTalk.forEach(function(talk) {
        talks.push(talk.client);
    });
    res.json(talks);
});

app.get('/chat/createTalk/:host/:client', function(req, res) {
    var socket = ConnectionInfo.connections[req.params.host].socket;
    ConnectionInfo.connections[req.params.host].activeTalk.push({client: req.params.client});
    socket.emit('refreshOnline');
    socket.emit('refreshActive');
    res.cookie('host', req.params.host, {
        maxAge: 800000,
        httpOnly: false
    });
    res.cookie('client', req.params.client, {
        maxAge: 800000,
        httpOnly: false
    });
    res.location('/chat/' + req.params.client);
    res.sendFile('./client/talk.html', {"root": __dirname});
});

app.get('/chat/getTalk/:host/:client', function(req, res) {
    var reciver1 = req.params.client < req.params.host
        ? req.params.client
        : req.params.host;
    var reciver2 = req.params.client < req.params.host
        ? req.params.host
        : req.params.client;
    Message.find({
        'reciver1': reciver1,
        'reciver2': reciver2
    }, 'from time msg', function(err, talk) {
        if (err) {
            console.log(err);
        } else if (talk) {
            res.json(talk);
        }
        res.end();
    });
});

// SOCKET.IO
io.on('connection', function(socket) {
    socket.on('disconnect', function() {
        if (socket.forLogin !== undefined) {
            delete ConnectionInfo.connections[socket.forLogin];
            for (var key in ConnectionInfo.connections) {
                ConnectionInfo.connections[key].socket.emit('refreshOnline');
            }
        } else if (socket.forTalk.host in ConnectionInfo.connections) {
            var mainSocket = ConnectionInfo.connections[socket.forTalk.host].socket;
            var talkIdx = 0;
            for (var i = 0; i < ConnectionInfo.connections[socket.forTalk.host].activeTalk.length; ++i) {
                if (ConnectionInfo.connections[socket.forTalk.host].activeTalk[i].client === socket.forTalk.client) {
                    talkIdx = i;
                    break;
                }
            }
            ConnectionInfo.connections[socket.forTalk.host].activeTalk.splice(talkIdx, 1);
            mainSocket.emit('refreshOnline');
            mainSocket.emit('refreshActive');
        }
    });

    socket.on('identify', function(login) {
        socket.forLogin = login;
        ConnectionInfo.connections[login] = {};
        ConnectionInfo.connections[login].activeTalk = [];
        ConnectionInfo.connections[login].socket = socket;
        for (var key in ConnectionInfo.connections) {
            ConnectionInfo.connections[key].socket.emit('refreshOnline');
        }
        socket.emit('identifyDone');
    });

    socket.on('createTalk', function(info) {
        socket.forTalk = info;
        for (var i = 0; i < ConnectionInfo.connections[info.host].activeTalk.length; ++i) {
            if (ConnectionInfo.connections[info.host].activeTalk[i].client === info.client) {
                ConnectionInfo.connections[info.host].activeTalk[i].socket = socket;
                break;
            }
        }
    });

    socket.on('send', function(msg) {
        socket.emit('reciveMsg', {
            msg: msg.msg,
            time: msg.time,
            from: msg.host
        });
        if (msg.client in ConnectionInfo.connections) {
            for (var i = 0; i < ConnectionInfo.connections[msg.client].activeTalk.length; ++i) {
                if (ConnectionInfo.connections[msg.client].activeTalk[i].client === msg.host) {
                    ConnectionInfo.connections[msg.client].activeTalk[i].socket.emit('reciveMsg', {
                        msg: msg.msg,
                        time: msg.time,
                        from: msg.host
                    });
                    break;
                }
            }
        }
        var reciver1 = msg.client < msg.host
            ? msg.client
            : msg.host;
        var reciver2 = msg.client < msg.host
            ? msg.host
            : msg.client;
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
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {});

app.get('*', function(req, res) {
    res.sendFile('./client/index.html', {"root": __dirname});
});

// TODO
// single page app
// restore session
// logout
// chat bootstrap css
// active talk
// online users
// history talk
// https
