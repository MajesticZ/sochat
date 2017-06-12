/* global angular */
var app = angular.module('SoChat', ['ngMessages', 'ngCookies']);
app.controller('ChatController', [
    '$scope',
    '$http',
    '$cookies',
    function($scope, $http, $cookies) {
        $scope.login = $cookies.get('login');
        $scope.token = $cookies.get('token');
        $scope.online = [];
        $scope.history = [];
        $scope.activeTalk = "";
        $scope.msg = "";
        /* global io */
        var socket = io();

        socket.on('connect', function() {
            socket.emit('identify', $scope.login);
        });

        socket.on('sessionExpired', function() {
            window.location = "/";
        });

        socket.on('refreshOnline', function() {
            $http.get('/chat/list/onlineUsers/' + $scope.login + '/' + $scope.token).then(function(res) {
                $scope.online = res.data;
            });
        });

        socket.on('refreshHistory', function() {
            $http.get('/chat/history/' + $scope.login + '/' + $scope.token).then(function(res) {
                $scope.history = res.data;
            });
        });

        $scope.startTalk = function(withUser) {
                var isInHistory = false;
                for (var i in $scope.history) {
                    if ($scope.history[i].client === withUser) {
                        isInHistory = true;
                        break;
                    }
                }
                if (!isInHistory) {
                    $scope.history.push({client: withUser});
                }
                $('#chat').html("");
                $scope.activeTalk = withUser;
                $http.get('/chat/history/' + $scope.login + '/' + $scope.token + '/' + $scope.activeTalk).then(function(res) {
                    res.data.forEach(function(msg) {
                        var p = $('<p>').text(msg.msg);
                        var time = $('<time>').text(msg.time);
                        var text = $('<div>').append(p).append(time).addClass("text");
                        var textWraper = $('<div>').append(text).addClass("text_wrapper");
                        $('#chat').append($('<li>').append(textWraper).addClass(msg.from === $scope.login
                            ? "message right appeared"
                            : "message left appeared"));
                    });
                    var chatDiv = document.getElementById("chatDiv");
                    chatDiv.scrollTop = chatDiv.scrollHeight;
                });
        }

        socket.on('reciveMsg', function(msg) {
            var p = $('<p>').text(msg.msg);
            var time = $('<time>').text(msg.time);
            var text = $('<div>').append(p).append(time).addClass("text");
            var textWraper = $('<div>').append(text).addClass("text_wrapper");
            $('#chat').append($('<li>').append(textWraper).addClass(msg.from === $scope.login
                ? "message right appeared"
                : "message left appeared"));
            var chatDiv = document.getElementById("chatDiv");
            chatDiv.scrollTop = chatDiv.scrollHeight;
        });

        $scope.sendMsg = function(event) {
            if (event.keyCode == 13 && $scope.msg.length > 0 && $scope.activeTalk.length > 0) {
                var date = new Date();
                var time = date.getHours() + ':' + date.getMinutes();
                socket.emit('send', {
                    host: $scope.login,
                    client: $scope.activeTalk,
                    msg: $scope.msg,
                    time: time
                });
                $scope.msg = "";
            }
        };
    }
]);
