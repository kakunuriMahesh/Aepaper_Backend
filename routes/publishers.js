const express = require('express');
const router = express.Router();
const {
  createPublisher,
  getAllPublishers,
  getPublisherById,
  updatePublisher,
  deletePublisher,
} = require('../controllers/publisherController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const trackActivity = require('../middleware/auditLogger');

router.use(auth);

router.get('/', authorize('SUPER_ADMIN'), getAllPublishers);
router.post('/', authorize('SUPER_ADMIN'), trackActivity('PUBLISHER_CREATE', 'Publisher'), createPublisher);
router.get('/:id', authorize('SUPER_ADMIN'), getPublisherById);
router.put('/:id', authorize('SUPER_ADMIN'), trackActivity('PUBLISHER_UPDATE', 'Publisher'), updatePublisher);
router.delete('/:id', authorize('SUPER_ADMIN'), deletePublisher);

module.exports = router;
