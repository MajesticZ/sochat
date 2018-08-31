module.exports = {
    somethingWrong: {
        error: {
            somethingWrong: true
        }
    },
    userDontExist: {
        error: {
            userDontExist: true
        }
    },
    userAlreadySignin: {
        error: {
            userAlreadySignin: true
        }
    },
    wrongPassword: {
        error: {
            wrongPassword: true
        }
    },
    userAlreadyExist: {
        error: {
            userAlreadyExist: true
        }
    },
    response: function(res, type) {
        res.json(type);
        res.end();
    }
};
