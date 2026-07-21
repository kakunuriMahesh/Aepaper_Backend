const express = require('express');
const router = express.Router();
const LegalPage = require('../models/LegalPage');
const { asyncHandler } = require('../utils/helpers');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const trackActivity = require('../middleware/auditLogger');

router.use(auth);
router.use(authorize('TENANT_ADMIN'));

router.get('/', asyncHandler(async (req, res) => {
  if (!req.user.publisherId) {
    return res.status(400).json({ success: false, message: 'No publisher associated' });
  }
  const pages = await LegalPage.find({ publisherId: req.user.publisherId });
  return res.status(200).json({ success: true, data: pages });
}));

router.get('/:type', asyncHandler(async (req, res) => {
  if (!req.user.publisherId) {
    return res.status(400).json({ success: false, message: 'No publisher associated' });
  }
  const page = await LegalPage.findOne({ publisherId: req.user.publisherId, type: req.params.type });
  return res.status(200).json({ success: true, data: page });
}));

router.put('/:type', trackActivity('LEGAL_PAGE_UPDATE', 'LegalPage'), asyncHandler(async (req, res) => {
  if (!req.user.publisherId) {
    return res.status(400).json({ success: false, message: 'No publisher associated' });
  }
  const { title, content } = req.body;

  const page = await LegalPage.findOneAndUpdate(
    { publisherId: req.user.publisherId, type: req.params.type },
    {
      publisherId: req.user.publisherId,
      type: req.params.type,
      title: title || {},
      content: content || {},
    },
    { upsert: true, new: true }
  );

  return res.status(200).json({ success: true, data: page });
}));

module.exports = router;
