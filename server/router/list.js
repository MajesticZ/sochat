const express = require('express');

const router = express.Router();

// CUSTOM MODULES
const connectionService = require('../service/connectionService');
const userService = require('../service/userService');
const messageService = require('../service/messageService');

router.get('/onlineUsers/:forUser/:withToken', (req, res) => {
  userService.checkToken(req.params.forUser, req.params.withToken, res, () => {
    connectionService.getOnlineUser(req.params.forUser, res);
  }, () => {
    connectionService.emitSessionExpiredForUser(req.params.forUser);
  });
});

router.get('/history/:forUser/:withToken', (req, res) => {
  userService.checkToken(req.params.forUser, req.params.withToken, res, () => {
    messageService.getHistory(req.params.forUser, res);
  }, () => {
    connectionService.emitSessionExpiredForUser(req.params.forUser);
  });
});

router.get('/history/:forUser/:withToken/:withClient', (req, res) => {
  userService.checkToken(req.params.forUser, req.params.withToken, res, () => {
    messageService.getTalk(req.params.forUser, req.params.withClient, res);
  }, () => {
    connectionService.emitSessionExpiredForUser(req.params.forUser);
  });
});

module.exports = router;
