const express = require('express');
const router = express.Router();
const {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
} = require('../controllers/articleController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const trackActivity = require('../middleware/auditLogger');

router.use(auth);

router.get('/', authorize('TENANT_ADMIN', 'EDITOR', 'REPORTER'), getAllArticles);
router.post('/', authorize('TENANT_ADMIN', 'EDITOR', 'REPORTER'), trackActivity('ARTICLE_CREATE', 'Article'), createArticle);
router.get('/:id', authorize('TENANT_ADMIN', 'EDITOR', 'REPORTER'), getArticleById);
router.put('/:id', authorize('TENANT_ADMIN', 'EDITOR', 'REPORTER'), trackActivity('ARTICLE_UPDATE', 'Article'), updateArticle);
router.delete('/:id', authorize('TENANT_ADMIN', 'EDITOR'), trackActivity('ARTICLE_DELETE', 'Article'), deleteArticle);
router.put('/:id/publish', authorize('TENANT_ADMIN', 'EDITOR'), trackActivity('ARTICLE_PUBLISH', 'Article'), publishArticle);
router.put('/:id/unpublish', authorize('TENANT_ADMIN', 'EDITOR'), trackActivity('ARTICLE_UNPUBLISH', 'Article'), unpublishArticle);

module.exports = router;
