const express = require('express');
const router = express.Router();
const {
  createAdvertisement,
  getAllAdvertisements,
  getAdvertisementById,
  updateAdvertisement,
  deleteAdvertisement,
} = require('../controllers/advertisementController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const trackActivity = require('../middleware/auditLogger');

router.use(auth);
router.use(authorize('TENANT_ADMIN', 'EDITOR'));

router.get('/', getAllAdvertisements);
router.post('/', trackActivity('AD_CREATE', 'Advertisement'), createAdvertisement);
router.get('/:id', getAdvertisementById);
router.put('/:id', trackActivity('AD_UPDATE', 'Advertisement'), updateAdvertisement);
router.delete('/:id', trackActivity('AD_DELETE', 'Advertisement'), deleteAdvertisement);

module.exports = router;
