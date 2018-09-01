const express = require('express');

const router = express.Router();

// CUSTOM MODULES
const userService = require('../service/userService');

router.post('/signin', (req, res) => {
  userService.signIn(req.body.login, req.body.password, res);
});

router.post('/signup', (req, res) => {
  userService.signUp(req.body.login, req.body.password, res);
});

module.exports = router;
