const express = require('express');
const router = express.Router();
const { createUser, getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const trackActivity = require('../middleware/auditLogger');

router.use(auth);
router.use(authorize('SUPER_ADMIN'));

router.get('/', getAllUsers);
router.post('/', trackActivity('USER_CREATE', 'User'), createUser);
router.get('/:id', getUserById);
router.put('/:id', trackActivity('USER_UPDATE', 'User'), updateUser);
router.delete('/:id', trackActivity('USER_DELETE', 'User'), deleteUser);

module.exports = router;
