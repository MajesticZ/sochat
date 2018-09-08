const express = require('express');

const router = express.Router();

// CUSTOM MODULES
const userController = require('../controller/userController');

router.post('/signin', userController.signIn);
router.post('/signup', userController.signUp);

module.exports = router;
