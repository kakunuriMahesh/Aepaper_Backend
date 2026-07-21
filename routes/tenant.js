const express = require('express');
const router = express.Router();
const Publisher = require('../models/Publisher');
const User = require('../models/User');
const { asyncHandler, paginate } = require('../utils/helpers');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const trackActivity = require('../middleware/auditLogger');

router.use(auth);
router.use(authorize('TENANT_ADMIN'));

router.get('/settings', asyncHandler(async (req, res) => {
  if (!req.user.publisherId) {
    return res.status(400).json({ success: false, message: 'No publisher associated' });
  }
  const publisher = await Publisher.findById(req.user.publisherId);
  if (!publisher) {
    return res.status(404).json({ success: false, message: 'Publisher not found' });
  }
  return res.status(200).json({ success: true, data: publisher });
}));

router.put('/settings', trackActivity('SETTINGS_UPDATE', 'Publisher'), asyncHandler(async (req, res) => {
  if (!req.user.publisherId) {
    return res.status(400).json({ success: false, message: 'No publisher associated' });
  }
  const publisher = await Publisher.findById(req.user.publisherId);
  if (!publisher) {
    return res.status(404).json({ success: false, message: 'Publisher not found' });
  }

  const allowedFields = ['name', 'shortName', 'themeColor', 'logoUrl', 'appIconUrl', 'appIconLargeUrl', 'customDomain', 'supportedLanguages'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      publisher[field] = req.body[field];
    }
  });

  await publisher.save();
  return res.status(200).json({ success: true, data: publisher });
}));

router.get('/users', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';

  const filter = { publisherId: req.user.publisherId };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(filter);
  const users = await paginate(
    User.find(filter).sort({ createdAt: -1 }),
    page,
    limit
  );

  return res.status(200).json({
    success: true,
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

router.post('/users', trackActivity('USER_CREATE', 'User'), asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already in use' });
  }

  const allowedRoles = ['TENANT_ADMIN', 'EDITOR', 'REPORTER'];
  const userRole = allowedRoles.includes(role) ? role : 'EDITOR';

  const user = await User.create({
    publisherId: req.user.publisherId,
    name,
    email: email.toLowerCase(),
    passwordHash: password,
    role: userRole,
  });

  return res.status(201).json({ success: true, data: user });
}));

router.put('/users/:id', trackActivity('USER_UPDATE', 'User'), asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, publisherId: req.user.publisherId });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const { name, email, password, role, status } = req.body;

  if (email && email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    user.email = email.toLowerCase();
  }

  if (name) user.name = name;
  if (role) user.role = role;
  if (status) user.status = status;
  if (password) user.passwordHash = password;

  await user.save();
  return res.status(200).json({ success: true, data: user });
}));

router.delete('/users/:id', trackActivity('USER_DELETE', 'User'), asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, publisherId: req.user.publisherId });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (String(user._id) === String(req.user.id)) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  }

  await User.findByIdAndDelete(req.params.id);
  return res.status(200).json({ success: true, message: 'User deleted successfully' });
}));

module.exports = router;
