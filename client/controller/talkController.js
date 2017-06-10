/* global angular */
var app = angular.module('SoChat', ['ngMaterial', 'ngCookies']);
app.controller('TalkController', ['$scope', '$http', '$cookies', function($scope, $http, $cookies) {
    $scope.host = $cookies.get('host');
    $scope.client = $cookies.get('client');
    $scope.msg = "";
    
    $http.get('/chat/getTalk/' + $scope.host + '/' + $scope.client).then(function (res){
        res.data.forEach(function(msg){
            var div = $('<div>').append($('<p>').text(msg.msg)).append($('<time>').text(msg.time)).addClass("msg");
            $('#chat').append($('<li>').append(div).addClass(msg.from === $scope.host ? "self" : "other")); 
        });
        /* global $ */
        window.scrollTo(0, 9999999);
        $('#mainDiv').removeAttr('ng-cloak');
    });
    
    /* global io */
    var socket = io();
    
    socket.on('connect', function(){
        socket.emit('createTalk', {host: $scope.host, client: $scope.client});
    });
    
    socket.on('reciveMsg', function (msg) {
        /* global $ */
        var div = $('<div>').append($('<p>').text(msg.msg)).append($('<time>').text(msg.time)).addClass("msg");
        $('#chat').append($('<li>').append(div).addClass(msg.from === $scope.host ? "self" : "other"));
        window.scrollTo(0, 9999999); 
    });
    
    $scope.sendMsg = function(event){
        if(event.keyCode == 13 && $scope.msg.length > 0){
            var date = new Date();
            var time = date.getHours() + ':' + date.getMinutes();
            socket.emit('send', {host: $scope.host, client: $scope.client, msg: $scope.msg, time: time});
            $scope.msg = "";
        }
    };
}]);

