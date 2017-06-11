const crypto = require('crypto');
const moment = require('moment');
const uuidV1 = require('uuid/v1');

// CUSTOM MODULES
const ConnectionInfo = require('../util/connection-info.js');
const ErrorMessage = require('../util/error-messages.js');

var UserDAO = null;

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
                    tokenExpiredTime: moment().add(12, 'hours')
                }
            }, function(err, updated) {
                if (err) {
                    console.log(err);
                    ErrorMessage.response(res, ErrorMessage.somethingWrong);
                } else {
                    res.cookie('login', user.login, {
                        maxAge: 800000,
                        httpOnly: false
                    });
                    res.cookie('token', token, {
                        maxAge: 800000,
                        httpOnly: false
                    });
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
                tokenExpiredTime: moment().add(12, 'hours')
            }, function(err, created) {
                if (err) {
                    console.log(err);
                    ErrorMessage.response(res, ErrorMessage.somethingWrong);
                } else {
                    res.cookie('login', login, {
                        maxAge: 800000,
                        httpOnly: false
                    });
                    res.cookie('token', token, {
                        maxAge: 800000,
                        httpOnly: false
                    });
                    res.end();
                }
            });
        }
    }
    return UserService;
};
