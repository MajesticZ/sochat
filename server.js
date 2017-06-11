const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const morgan = require('morgan');
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
app.use(express.static(__dirname + '/client/public'));
app.use(morgan('dev'));
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

app.get('/chat/list/onlineUsers/:forUser/:withToken', function(req, res) {
    UserService.checkToken(req.params.forUser, req.params.withToken, res, function () {
        ConnectionInfo.getOnlineUser(req.params.forUser, res);
    }, function () {
        ConnectionInfo.connections[req.params.forUser].emit('sessionExpired');
    });
});

app.get('/chat/history/:forUser/:withToken', function(req, res) {
    UserService.checkToken(req.params.forUser, req.params.withToken, res, function () {
        // ConnectionInfo.getOnlineUser(req.params.forUser, res);
    }, function () {
        ConnectionInfo.connections[req.params.forUser].emit('sessionExpired');
    });
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
        socket.broadcast.emit('refreshOnline');
        delete ConnectionInfo.connections[socket.forLogin];
    });

    socket.on('identify', function(login) {
        socket.forLogin = login;
        ConnectionInfo.connections[login] = socket;
        for (var key in ConnectionInfo.connections) {
            ConnectionInfo.connections[key].socket.emit('refreshOnline');
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
app.get('*', function(req, res) {
    if (req.cookies && req.cookies.login && req.cookies.token) {
        UserService.signInWithToken(req.cookies.login, req.cookies.token, {
            failure: './client/index.html',
            success: './client/chat.html',
            root: {
                "root": __dirname
            }
        }, res);
    } else {
        res.sendFile('./client/index.html', {"root": __dirname});
    }
});
server.listen(8080, function() {});

// TODO
// history talk
// chat bootstrap css
// https
// list rolup
// html different scrollbar
// migrate to jade
