const express = require('express');
const router = express.Router();
const { createDailyPaper, getAllDailyPapers, getDailyPaperById, updateDailyPaper, deleteDailyPaper, deleteMultipleDailyPapers } = require('../controllers/dailyPaperController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(auth);

router.get('/', authorize('TENANT_ADMIN', 'EDITOR'), getAllDailyPapers);
router.get('/:id', authorize('TENANT_ADMIN', 'EDITOR'), getDailyPaperById);
router.post('/', authorize('TENANT_ADMIN', 'EDITOR'), createDailyPaper);
router.put('/:id', authorize('TENANT_ADMIN', 'EDITOR'), updateDailyPaper);
router.delete('/:id', authorize('TENANT_ADMIN', 'EDITOR'), deleteDailyPaper);
router.post('/delete-many', authorize('TENANT_ADMIN'), deleteMultipleDailyPapers);

module.exports = router;
