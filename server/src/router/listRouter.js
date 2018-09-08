const express = require('express');

const router = express.Router();

// CUSTOM MODULES
const listController = require('../controller/listController');
const tokenValidator = require('../middleware/tokenValidator');

router.get('/onlineUsers/:forUser/:withToken', tokenValidator.checkToken, listController.onlineUsersForUserWithToken);
router.get('/history/:forUser/:withToken', tokenValidator.checkToken, listController.historyForUserWithToken);
router.get('/history/:forUser/:withToken/:withClient', tokenValidator.checkToken, listController.historyForUserWithHostWithToken);

module.exports = router;
