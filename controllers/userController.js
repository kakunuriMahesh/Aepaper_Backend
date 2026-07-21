const User = require('../models/User');
const { asyncHandler, paginate } = require('../utils/helpers');

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, publisherId, status } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
  }

  let targetPublisherId = publisherId;

  if (req.user.role === 'TENANT_ADMIN') {
    targetPublisherId = req.user.publisherId;
    if (role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot create super admin' });
    }
  }

  if (req.user.role === 'SUPER_ADMIN' && !publisherId) {
    return res.status(400).json({ success: false, message: 'Publisher ID is required' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already in use' });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: password,
    role,
    publisherId: targetPublisherId,
    status,
  });

  return res.status(201).json({ success: true, data: user });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';

  const filter = {};

  if (req.user.role === 'TENANT_ADMIN') {
    filter.publisherId = req.user.publisherId;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(filter);
  const users = await paginate(User.find(filter).sort({ createdAt: -1 }), page, limit);

  return res.status(200).json({
    success: true,
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (req.user.role === 'TENANT_ADMIN' && String(user.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  return res.status(200).json({ success: true, data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (req.user.role === 'TENANT_ADMIN' && String(user.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const { name, email, role, status, publisherId, password } = req.body;

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();
  if (role && req.user.role === 'SUPER_ADMIN') user.role = role;
  if (status) user.status = status;
  if (publisherId && req.user.role === 'SUPER_ADMIN') user.publisherId = publisherId;
  if (password) user.passwordHash = password;

  await user.save();
  return res.status(200).json({ success: true, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (req.user.role === 'TENANT_ADMIN' && String(user.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (user.role === 'SUPER_ADMIN') {
    return res.status(400).json({ success: false, message: 'Cannot delete super admin' });
  }

  await User.findByIdAndDelete(req.params.id);
  return res.status(200).json({ success: true, message: 'User deleted successfully' });
});

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };
