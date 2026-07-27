const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, publisherId: user.publisherId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const register = asyncHandler(async (req, res) => {
  const existingSuperAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
  if (existingSuperAdmin) {
    return res.status(400).json({ success: false, message: 'Super admin already exists' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: password,
    role: 'SUPER_ADMIN',
    publisherId: null,
  });

  const token = generateToken(user);
  setTokenCookie(res, token);

  return res.status(201).json({ success: true, data: user, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (user.status === 'INACTIVE') {
    return res.status(403).json({ success: false, message: 'Account is inactive' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = generateToken(user);
  setTokenCookie(res, token);

  const populatedUser = await User.findById(user._id).populate('publisherId');

  return res.status(200).json({ success: true, data: populatedUser, token });
});

const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('publisherId');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  return res.status(200).json({ success: true, data: user });
});

module.exports = { register, login, logout, getMe };
