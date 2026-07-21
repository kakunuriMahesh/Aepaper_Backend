const BreakingNews = require('../models/BreakingNews');
const { asyncHandler, paginate } = require('../utils/helpers');

const createBreakingNews = asyncHandler(async (req, res) => {
  const { headline, content, linkUrl, priority, status, startAt, endAt } = req.body;

  if (!headline) {
    return res.status(400).json({ success: false, message: 'Headline is required' });
  }

  if (!req.user.publisherId) {
    return res.status(400).json({ success: false, message: 'No publisher associated' });
  }

  const news = await BreakingNews.create({
    publisherId: req.user.publisherId,
    headline,
    content,
    linkUrl,
    priority,
    status,
    startAt,
    endAt,
    createdBy: req.user.id,
  });

  return res.status(201).json({ success: true, data: news });
});

const getAllBreakingNews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { status, search } = req.query;

  const filter = {};
  if (req.user.publisherId) {
    filter.publisherId = req.user.publisherId;
  }
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { headline: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await BreakingNews.countDocuments(filter);
  const news = await paginate(
    BreakingNews.find(filter).populate('createdBy', 'name').sort({ priority: -1, createdAt: -1 }).lean(),
    page,
    limit
  );

  return res.status(200).json({
    success: true,
    data: news,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

const getBreakingNewsById = asyncHandler(async (req, res) => {
  const news = await BreakingNews.findById(req.params.id).lean();
  if (!news) {
    return res.status(404).json({ success: false, message: 'Breaking news not found' });
  }
  if (String(news.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  return res.status(200).json({ success: true, data: news });
});

const updateBreakingNews = asyncHandler(async (req, res) => {
  const news = await BreakingNews.findById(req.params.id);
  if (!news) {
    return res.status(404).json({ success: false, message: 'Breaking news not found' });
  }
  if (String(news.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const allowedFields = ['headline', 'content', 'linkUrl', 'priority', 'status', 'startAt', 'endAt'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      news[field] = req.body[field];
    }
  });

  await news.save();
  return res.status(200).json({ success: true, data: news });
});

const deleteBreakingNews = asyncHandler(async (req, res) => {
  const news = await BreakingNews.findById(req.params.id);
  if (!news) {
    return res.status(404).json({ success: false, message: 'Breaking news not found' });
  }
  if (String(news.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  await BreakingNews.findByIdAndDelete(req.params.id);
  return res.status(200).json({ success: true, message: 'Breaking news deleted' });
});

module.exports = {
  createBreakingNews,
  getAllBreakingNews,
  getBreakingNewsById,
  updateBreakingNews,
  deleteBreakingNews,
};
