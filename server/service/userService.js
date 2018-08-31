const crypto = require('crypto');
const moment = require('moment');
const uuidV1 = require('uuid/v1');

// CUSTOM MODULES
const userModel = require('../model/user');
const connectionInfo = require('../util/connectionInfo');
const errorMessage = require('../util/errorMessages');

const TokenTimeout = 800000;

module.exports = {
    signIn: function(login, password, res) {
      userModel.findOne({
            'login': login
        }, 'login password token tokenExpiredTime', function(err, user) {
            if (err) {
                errorMessage.response(res, errorMessage.somethingWrong);
            } else if (user === null) {
                errorMessage.response(res, errorMessage.userDontExist);
            } else if (login in connectionInfo.connections || (user.token !== "" && user.tokenExpiredTime > new Date())) {
                errorMessage.response(res, errorMessage.userAlreadySignin);
            } else if (crypto.createHmac('sha256', password).digest('hex') !== user.password) {
                errorMessage.response(res, errorMessage.wrongPassword);
            } else {
                module.exports.createTokenAndResponse(user, res);
            }
        });
    },
    signInWithToken: function(login, token, urls, res) {
        module.exports.checkToken(login, token, res, function(res) {
            res.location('/chat/');
            res.sendFile(urls.success, urls.root);
        }, function(res) {
            res.location('/');
            res.sendFile(urls.failure, urls.root);
        });
    },
    signUp: function(login, password, res) {
        userModel.findOne({
            'login': login
        }, 'login password token', function(err, user) {
            if (err) {
                errorMessage.response(res, errorMessage.somethingWrong);
            } else if (user !== null) {
                errorMessage.response(res, errorMessage.userAlreadyExist);
            } else {
                module.exports.createUserAndResponse(login, password, res);
            }
        });
    },
    createTokenAndResponse: function(user, res) {
      const token = uuidV1();
      userModel.update({
            _id: user.id
        }, {
            $set: {
                token: token,
                tokenExpiredTime: moment().add(TokenTimeout, 'ms')
            }
        }, function(err) {
            if (err) {
                console.log(err);
                errorMessage.response(res, errorMessage.somethingWrong);
            } else {
                module.exports.addSessionCookie(user.login, token, res);
                res.end();
            }
        });
    },
    createUserAndResponse: function(login, password, res) {
      console.log(arguments);
      const token = uuidV1();
      userModel.create({
            login: login,
            password: crypto.createHmac('sha256', password).digest('hex'),
            token: token,
            tokenExpiredTime: moment().add(TokenTimeout, 'ms')
        }, function(err) {
            if (err) {
                console.log(err);
                errorMessage.response(res, errorMessage.somethingWrong);
            } else {
                module.exports.addSessionCookie(login, token, res);
                res.end();
            }
        });
    },
    addSessionCookie: function(login, token, res) {
        res.cookie('login', login, {
            maxAge: TokenTimeout,
            httpOnly: false
        });
        res.cookie('token', token, {
            maxAge: TokenTimeout,
            httpOnly: false
        });
    },
    checkToken: function(login, token, res, success, failure) {
      userModel.findOne({
            'login': login,
            'token': token
        }, 'login tokenExpiredTime', function(err, user) {
          if (err) {
                console.log(err);
                failure(res);
            } else if (user === null || user.tokenExpiredTime < new Date()) {
                failure(res);
            } else {
                module.exports.refreshToken(login);
                module.exports.addSessionCookie(login, token, res);
                success(res);
            }
        });
    },
    refreshToken: function(login) {
        userModel.update({
            login: login
        }, {
            $set: {
                tokenExpiredTime: moment().add(TokenTimeout, 'ms')
            }
        }, function(err) {
          if (err) {
                console.log(err);
            }
        });
    }
};
