const express = require('express');
const router = express.Router();
const { createBreakingNews, getAllBreakingNews, getBreakingNewsById, updateBreakingNews, deleteBreakingNews } = require('../controllers/breakingNewsController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(auth);

router.get('/', authorize('TENANT_ADMIN', 'EDITOR', 'REPORTER'), getAllBreakingNews);
router.get('/:id', authorize('TENANT_ADMIN', 'EDITOR', 'REPORTER'), getBreakingNewsById);
router.post('/', authorize('TENANT_ADMIN', 'EDITOR'), createBreakingNews);
router.put('/:id', authorize('TENANT_ADMIN', 'EDITOR'), updateBreakingNews);
router.delete('/:id', authorize('TENANT_ADMIN', 'EDITOR'), deleteBreakingNews);

module.exports = router;
