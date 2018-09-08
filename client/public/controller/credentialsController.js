/* global angular */
var app = angular.module('SoChat', ['ngMessages', 'ngCookies']);
app.controller('CredentialsController', [
    '$scope',
    '$http',
    '$cookies',
    function($scope, $http, $cookies) {
        $scope.signIn = function() {
            if (!$scope.credentialsForm.$invalid) {
                $http.post('/chat/user/signin', {
                    'login': $scope.login,
                    'password': $scope.password
                }).then(function() {
                  window.location = '/chat/';
                }, function (res) {
                  if (res.data.error) {
                    if (res.data.type === errorTypes.user.wrongPassword) {
                      createMassage("Wrong password");
                    } else if (res.data.type === errorTypes.user.dontExist) {
                      createMassage("User don't exist");
                    } else if (res.data.type === errorTypes.user.alreadySignIn) {
                      createMassage("User already signin");
                    }
                  } else {
                      createMassage("Something going wrong with server");
                  }
                });
            } else {
                $scope.credentialsForm.$$controls.forEach(function(control) {
                    control.$touched = true;
                });
            }
        };
        $scope.signUp = function() {
            if (!$scope.credentialsForm.$invalid) {
                $http.post('/chat/user/signup', {
                    'login': $scope.login,
                    'password': $scope.password
                }).then(function() {
                  window.location = '/chat/';
                }, function (res) {
                  if (res.data.error) {
                    if (res.data.type === errorTypes.user.alreadyExist) {
                      createMassage("User already exist");
                    }
                  } else {
                      createMassage("Something going wrong with server");
                  }
                });
            } else {
                $scope.credentialsForm.$$controls.forEach(function(control) {
                    control.$touched = true;
                });
            }
        };
    }
]);

function createMassage(text) {
    var div = $('<div>').addClass('alert alert-dismissible alert-danger');
    var close = $('<button>').addClass('close').attr('type', 'button').attr('data-dismiss', 'alert').append('&times;');
    $('#mainPanel').prepend(div.append(close).append(text));
}
