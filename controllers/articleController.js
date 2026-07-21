const Article = require('../models/Article');
const { asyncHandler, paginate } = require('../utils/helpers');

const createArticle = asyncHandler(async (req, res) => {
  const { categoryId, featuredImageUrl, thumbnailUrl, images, availableLocales, translations, status } = req.body;

  if (!req.user.publisherId) {
    return res.status(400).json({ success: false, message: 'No publisher associated' });
  }

  const article = await Article.create({
    publisherId: req.user.publisherId,
    authorId: req.user.id,
    categoryId,
    featuredImageUrl,
    thumbnailUrl,
    images,
    availableLocales,
    translations,
    status,
  });

  return res.status(201).json({ success: true, data: article });
});

const getAllArticles = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { status, categoryId, locale } = req.query;

  const filter = {};

  if (req.user.publisherId) {
    filter.publisherId = req.user.publisherId;
  }

  if (req.user.role === 'REPORTER') {
    filter.authorId = req.user.id;
  }

  if (status) filter.status = status;
  if (categoryId) filter.categoryId = categoryId;
  if (locale) filter.availableLocales = locale;

  const total = await Article.countDocuments(filter);
  const skip = (page - 1) * limit;
  const articles = await Article.find(filter)
    .populate('authorId', 'name email')
    .populate('categoryId', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json({
    success: true,
    data: articles,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

const getArticleById = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id)
    .populate('authorId', 'name email')
    .populate('categoryId', 'name slug');

  if (!article) {
    return res.status(404).json({ success: false, message: 'Article not found' });
  }

  if (String(article.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (req.user.role === 'REPORTER' && String(article.authorId._id || article.authorId) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  return res.status(200).json({ success: true, data: article });
});

const updateArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) {
    return res.status(404).json({ success: false, message: 'Article not found' });
  }

  if (String(article.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (req.user.role === 'REPORTER' && String(article.authorId) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const allowedFields = ['categoryId', 'featuredImageUrl', 'thumbnailUrl', 'images', 'availableLocales', 'translations', 'status'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      article[field] = req.body[field];
    }
  });

  await article.save();
  return res.status(200).json({ success: true, data: article });
});

const deleteArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) {
    return res.status(404).json({ success: false, message: 'Article not found' });
  }

  if (String(article.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (req.user.role === 'REPORTER' && String(article.authorId) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  await Article.findByIdAndDelete(req.params.id);
  return res.status(200).json({ success: true, message: 'Article deleted successfully' });
});

const publishArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) {
    return res.status(404).json({ success: false, message: 'Article not found' });
  }

  if (String(article.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  article.status = 'PUBLISHED';
  article.publishedAt = new Date();
  await article.save();

  return res.status(200).json({ success: true, data: article });
});

const unpublishArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) {
    return res.status(404).json({ success: false, message: 'Article not found' });
  }

  if (String(article.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  article.status = 'DRAFT';
  article.publishedAt = null;
  await article.save();

  return res.status(200).json({ success: true, data: article });
});

module.exports = {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
};
