const https = require('https');
const fs = require('fs');
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
const MessageService = require('./server/service/message-service.js')(mongoose);

// GLOBAL
const options = {
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem')
};

const app = express();
const server = https.createServer(options, app);
const io = socketio(server);

// EXPRESS SETUP
app.use(express.static(__dirname + '/client/public'));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({'extended': 'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));

// MONGO SETUP
mongoose.connect('mongodb://localhost:27017/chat');

// ROUTING
app.post('/chat/signin', function(req, res) {
    UserService.signIn(req.body.login, req.body.password, res);
});

app.post('/chat/signup', function(req, res) {
    UserService.signUp(req.body.login, req.body.password, res);
});

app.get('/chat/list/onlineUsers/:forUser/:withToken', function(req, res) {
    UserService.checkToken(req.params.forUser, req.params.withToken, res, function() {
        ConnectionInfo.getOnlineUser(req.params.forUser, res);
    }, function() {
        ConnectionInfo.connections[req.params.forUser].emit('sessionExpired');
    });
});

app.get('/chat/history/:forUser/:withToken', function(req, res) {
    UserService.checkToken(req.params.forUser, req.params.withToken, res, function() {
        MessageService.getHistory(req.params.forUser, res);
    }, function() {
        ConnectionInfo.connections[req.params.forUser].emit('sessionExpired');
    });
});

app.get('/chat/history/:forUser/:withToken/:withClient', function(req, res) {
    UserService.checkToken(req.params.forUser, req.params.withToken, res, function() {
        MessageService.getTalk(req.params.forUser, req.params.withClient, res);
    }, function() {
        ConnectionInfo.connections[req.params.forUser].emit('sessionExpired');
    });
});

// SOCKET.IO
io.on('connection', function(socket) {
    socket.on('disconnect', function() {
        socket.broadcast.emit('refreshOnline');
        delete ConnectionInfo.connections[socket.forLogin];
    });

    socket.on('identify', function(login) {
        if (login) {
            socket.forLogin = login;
            ConnectionInfo.connections[login] = socket;
            socket.emit('refreshHistory');
            for (var key in ConnectionInfo.connections) {
                ConnectionInfo.connections[key].emit('refreshOnline');
            }
        } else {
            socket.emit('sessionExpired');
        }
    });

    socket.on('send', function(msg) {
        MessageService.createMassage(msg.host, msg.client, msg.host, msg.time, msg.msg);
        socket.emit('reciveMsg', {
            msg: msg.msg,
            time: msg.time,
            from: msg.host
        });
        if (msg.client in ConnectionInfo.connections) {
            if (ConnectionInfo.connections[msg.client].talkWith !== msg.host) {
                ConnectionInfo.connections[msg.client].emit('refreshHistory');
            } else {
                ConnectionInfo.connections[msg.client].emit('reciveMsg', {
                    msg: msg.msg,
                    time: msg.time,
                    from: msg.host
                });
            }
        }
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
        res.location('/');
        res.sendFile('./client/index.html', {"root": __dirname});
    }
});
server.listen(8080, function() {});
