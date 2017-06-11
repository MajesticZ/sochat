const crypto = require('crypto');
const moment = require('moment');
const uuidV1 = require('uuid/v1');

// CUSTOM MODULES
const ConnectionInfo = require('../util/connection-info.js');
const ErrorMessage = require('../util/error-messages.js');

var UserDAO = null;

const TokenTimeout = 800000;

module.exports = function(mongoose) {
    UserDAO = mongoose.model('User', {
        login: String,
        password: String,
        token: String,
        tokenExpiredTime: Date
    });
    UserService = {
        signIn: function(login, password, res) {
            UserDAO.findOne({
                'login': login
            }, 'login password token tokenExpiredTime', function(err, user) {
                if (err) {
                    ErrorMessage.response(res, ErrorMessage.somethingWrong);
                } else if (user === null) {
                    ErrorMessage.response(res, ErrorMessage.userDontExist);
                } else if (login in ConnectionInfo.connections || (user.token !== "" && user.tokenExpiredTime > new Date())) {
                    ErrorMessage.response(res, ErrorMessage.userAlreadySignin);
                } else if (crypto.createHmac('sha256', password).digest('hex') !== user.password) {
                    ErrorMessage.response(res, ErrorMessage.wrongPassword);
                } else {
                    UserService.createTokenAndResponse(user, res);
                }
            });
        },
        signUp: function(login, password, res) {
            UserDAO.findOne({
                'login': login
            }, 'login password token', function(err, user) {
                if (err) {
                    ErrorMessage.response(res, ErrorMessage.somethingWrong);
                } else if (user !== null) {
                    ErrorMessage.response(res, ErrorMessage.userAlreadyExist);
                } else {
                    UserService.createUserAndResponse(login, password, res);
                }
            });
        },
        createTokenAndResponse: function(user, res) {
            var token = uuidV1();
            UserDAO.update({
                _id: user.id
            }, {
                $set: {
                    token: token,
                    tokenExpiredTime: moment().add(TokenTimeout, 'ms')
                }
            }, function(err, updated) {
                if (err) {
                    console.log(err);
                    ErrorMessage.response(res, ErrorMessage.somethingWrong);
                } else {
                    UserService.addSessionCookie(login, token, res);
                    res.end();
                }
            });
        },
        createUserAndResponse: function(login, password, res) {
            var token = uuidV1();
            UserDAO.create({
                login: login,
                password: crypto.createHmac('sha256', password).digest('hex'),
                token: token,
                tokenExpiredTime: moment().add(TokenTimeout, 'ms')
            }, function(err, created) {
                if (err) {
                    console.log(err);
                    ErrorMessage.response(res, ErrorMessage.somethingWrong);
                } else {
                    UserService.addSessionCookie(login, token, res);
                    res.end();
                }
            });
        },
        addSessionCookie: function(login, token, res){
            res.cookie('login', login, {
                maxAge: TokenTimeout,
                httpOnly: false
            });
            res.cookie('token', token, {
                maxAge: TokenTimeout,
                httpOnly: false
            });
        },
        checkToken: function(login, token, urls, res) {
            UserDAO.findOne({
                'login': login,
                'token': token
            }, 'login tokenExpiredTime', function(err, user) {
                if (err) {
                    console.log(err);
                    res.sendFile(urls.failure, urls.root);
                } else if (user === null || user.tokenExpiredTime < new Date()) {
                    res.sendFile(urls.failure, urls.root);
                } else {
                    UserService.refreshToken(login);
                    res.location('/chat/');
                    res.sendFile(urls.success, urls.root);
                }
            });
        },
        refreshToken: function(login) {
            UserDAO.update({
                login: login
            }, {
                $set: {
                    tokenExpiredTime: moment().add(TokenTimeout, 'ms')
                }
            }, function(err, updated) {
                if (err) {
                    console.log(err);
                }
            });
        },
        removeToken: function(login) {
            UserDAO.update({
                'login': login
            }, {
                $set: {
                    token: ''
                }
            }, function(err, updated) {
                if (err) {
                    console.log(err);
                }
            });
        }
    }
    return UserService;
};
