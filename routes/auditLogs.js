const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(auth);
router.use(authorize('SUPER_ADMIN', 'TENANT_ADMIN'));

router.get('/', getAuditLogs);

module.exports = router;
