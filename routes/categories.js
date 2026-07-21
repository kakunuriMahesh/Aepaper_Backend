const express = require('express');
const router = express.Router();
const { createCategory, getAllCategories, updateCategory, deleteCategory } = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const trackActivity = require('../middleware/auditLogger');

router.use(auth);

router.get('/', authorize('TENANT_ADMIN', 'EDITOR', 'REPORTER'), getAllCategories);
router.post('/', authorize('TENANT_ADMIN', 'EDITOR'), trackActivity('CATEGORY_CREATE', 'Category'), createCategory);
router.put('/:id', authorize('TENANT_ADMIN', 'EDITOR'), trackActivity('CATEGORY_UPDATE', 'Category'), updateCategory);
router.delete('/:id', authorize('TENANT_ADMIN', 'EDITOR'), trackActivity('CATEGORY_DELETE', 'Category'), deleteCategory);

module.exports = router;
