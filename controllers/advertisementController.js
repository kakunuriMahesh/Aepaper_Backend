const Advertisement = require('../models/Advertisement');
const { asyncHandler, paginate } = require('../utils/helpers');

const createAdvertisement = asyncHandler(async (req, res) => {
  const { title, imageUrl, linkUrl, position, size, customWidth, customHeight, priority, startDate, endDate, status, pricePerDay, currency } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  if (!req.user.publisherId) {
    return res.status(400).json({ success: false, message: 'No publisher associated' });
  }

  const ad = await Advertisement.create({
    publisherId: req.user.publisherId,
    title,
    imageUrl,
    linkUrl,
    position,
    size,
    customWidth,
    customHeight,
    priority,
    startDate,
    endDate,
    status,
    pricePerDay,
    currency,
  });

  return res.status(201).json({ success: true, data: ad });
});

const getAllAdvertisements = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { position, status } = req.query;

  const filter = {};
  if (req.user.publisherId) {
    filter.publisherId = req.user.publisherId;
  }
  if (position) filter.position = position;
  if (status) filter.status = status;

  const total = await Advertisement.countDocuments(filter);
  const ads = await paginate(
    Advertisement.find(filter).sort({ priority: -1, createdAt: -1 }),
    page,
    limit
  );

  return res.status(200).json({
    success: true,
    data: ads,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

const getAdvertisementById = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findById(req.params.id);
  if (!ad) {
    return res.status(404).json({ success: false, message: 'Advertisement not found' });
  }

  if (String(ad.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  return res.status(200).json({ success: true, data: ad });
});

const updateAdvertisement = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findById(req.params.id);
  if (!ad) {
    return res.status(404).json({ success: false, message: 'Advertisement not found' });
  }

  if (String(ad.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const allowedFields = ['title', 'imageUrl', 'linkUrl', 'position', 'size', 'customWidth', 'customHeight', 'priority', 'startDate', 'endDate', 'status', 'pricePerDay', 'currency'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      ad[field] = req.body[field];
    }
  });

  await ad.save();
  return res.status(200).json({ success: true, data: ad });
});

const deleteAdvertisement = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findById(req.params.id);
  if (!ad) {
    return res.status(404).json({ success: false, message: 'Advertisement not found' });
  }

  if (String(ad.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  await Advertisement.findByIdAndDelete(req.params.id);
  return res.status(200).json({ success: true, message: 'Advertisement deleted successfully' });
});

module.exports = {
  createAdvertisement,
  getAllAdvertisements,
  getAdvertisementById,
  updateAdvertisement,
  deleteAdvertisement,
};
