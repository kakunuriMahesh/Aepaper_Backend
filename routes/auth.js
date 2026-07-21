const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const trackActivity = require('../middleware/auditLogger');
const { asyncHandler } = require('../utils/helpers');

const authOnly = asyncHandler(async (req, res, next) => auth(req, res, next));

router.post('/register', trackActivity('USER_LOGIN', 'User'), register);
router.post('/login', trackActivity('USER_LOGIN', 'User'), login);
router.post('/logout', authOnly, logout);
router.get('/me', authOnly, getMe);

module.exports = router;
