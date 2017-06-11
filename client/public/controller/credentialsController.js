/* global angular */
var app = angular.module('SoChat', ['ngMessages', 'ngCookies']);
app.controller('CredentialsController', [
    '$scope',
    '$http',
    '$cookies',
    function($scope, $http, $cookies) {
        // if (res.data.error.sessionHasExpired) {
        //     createMassage("Session has expired");
        // }
        $scope.signIn = function() {
            if (!$scope.credentialsForm.$invalid) {
                $http.post('/chat/signin', {
                    'login': $scope.login,
                    'password': $scope.password
                }).then(function(res) {
                    if (res.data.error) {
                        if (res.data.error.wrongPassword) {
                            createMassage("Wrong password");
                        } else if (res.data.error.userDontExist) {
                            createMassage("User don't exist");
                        } else if (res.data.error.userAlreadySignin) {
                            createMassage("User already signin");
                        } else if (res.data.error.somethingWrong) {
                            createMassage("Something going wrong with server");
                        }
                    } else {
                        window.location = '/chat/';
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
                $http.post('/chat/signup', {
                    'login': $scope.login,
                    'password': $scope.password
                }).then(function(res) {
                    if (res.data.error) {
                        if (res.data.error.userAlreadyExist) {
                            createMassage("User already exist");
                        } else if (res.data.error.somethingWrong) {
                            createMassage("Something going wrong with server");
                        }
                    } else {
                        window.location = '/chat/';
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
