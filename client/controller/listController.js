/* global angular */
var app = angular.module('SoChat', ['ngMessages', 'ngCookies']);
app.controller('ListController', [
  '$scope',
  '$http',
  '$cookies',
  function($scope, $http, $cookies) {
    $scope.login = $cookies.get('login');
    if ($scope.login === undefined) {
      window.location = '/';
    }
    $scope.userOnline = {};
    $scope.activeTalk = {};
    $scope.talkWith = function(client) {
      var win = window.open('/chat/createTalk/' + $scope.login + '/' + client, '_blank');
      win.focus();
    };
    /* global io */
    var socket = io();

    socket.on('connect', function() {
      socket.emit('identify', $scope.login);
    });

    socket.on('identifyDone', function() {
      /* global $ */
      $('#mainDiv').removeAttr('ng-cloak');
    });

    socket.on('refreshOnline', function() {
      $http.get('/chat/list/onlineUsers/' + $scope.login).then(function(res) {
        $scope.userOnline = res.data;
      });
    });

    socket.on('refreshActive', function() {
      $http.get('/chat/list/activeTalk/' + $scope.login).then(function(res) {
        $scope.activeTalk = res.data;
      });
    });
  }
]);
