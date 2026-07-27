const Publisher = require('../models/Publisher');
const Category = require('../models/Category');
const Article = require('../models/Article');
const Advertisement = require('../models/Advertisement');
const DailyPaper = require('../models/DailyPaper');
const BreakingNews = require('../models/BreakingNews');
const LegalPage = require('../models/LegalPage');
const { asyncHandler } = require('../utils/helpers');

const resolvePublisher = asyncHandler(async (req, res, next) => {
  if (req.publisherId && req.publisher) return next();
  const domainParam = req.params.domain;
  if (!domainParam) {
    return res.status(400).json({ success: false, message: 'Domain parameter is required' });
  }

  const slug = domainParam.toLowerCase().trim();

  let publisher = await Publisher.findOne({
    $or: [
      { customDomain: slug },
      { customDomain: domainParam },
      { shortName: domainParam },
      { shortName: slug },
    ],
    status: { $in: ['ACTIVE', 'TRIAL'] },
  });

  if (!publisher) {
    const allActive = await Publisher.find({ status: { $in: ['ACTIVE', 'TRIAL'] } });
    publisher = allActive.find((p) => {
      const s = (p.shortName || p.name || '').toLowerCase().replace(/\s+/g, '-');
      return s === slug;
    });
  }

  if (!publisher) {
    return res.status(404).json({ success: false, message: 'Publisher not found for this domain' });
  }

  req.publisherId = publisher._id;
  req.publisher = publisher;
  next();
});

const getSiteData = asyncHandler(async (req, res) => {
  const publisher = req.publisher;

  const [categories, activeAds, latestBreaking] = await Promise.all([
    Category.find({ publisherId: publisher._id }).sort({ displayOrder: 1 }),
    Advertisement.find({
      publisherId: publisher._id,
      status: 'ACTIVE',
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: new Date() }, endDate: { $gte: new Date() } },
        { startDate: { $lte: new Date() }, endDate: null },
      ],
    }).sort({ priority: -1 }),
    BreakingNews.find({
      publisherId: publisher._id,
      status: 'ACTIVE',
      $or: [
        { startAt: { $lte: new Date() }, endAt: { $gte: new Date() } },
        { startAt: { $lte: new Date() }, endAt: null },
      ],
    })
      .sort({ priority: -1, createdAt: -1 })
      .limit(10),
  ]);

  const ads = {};
  activeAds.forEach((ad) => {
    const pos = ad.position;
    if (!ads[pos]) {
      ads[pos] = { title: ad.title, imageUrl: ad.imageUrl, linkUrl: ad.linkUrl, size: ad.size };
    }
  });

  return res.status(200).json({
    success: true,
    data: {
      publisher: {
        name: publisher.name,
        shortName: publisher.shortName,
        customDomain: publisher.customDomain,
        themeColor: publisher.themeColor,
        logoUrl: publisher.logoUrl,
        appIconUrl: publisher.appIconUrl,
        appIconLargeUrl: publisher.appIconLargeUrl,
        faviconUrl: publisher.faviconUrl,
        supportedLanguages: publisher.supportedLanguages,
        about: publisher.about || '',
        contact: publisher.contact || {},
      },
      categories,
      ads,
      breakingNews: latestBreaking,
    },
  });
});

const getArticles = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, search } = req.query;
  const query = { publisherId: req.publisherId, status: 'PUBLISHED' };
  if (category) {
    const cat = await Category.findOne({ publisherId: req.publisherId, slug: category });
    if (cat) query.categoryId = cat._id;
  }
  if (search) {
    query.$or = [
      { 'translations.en.title': { $regex: search, $options: 'i' } },
      { 'translations.hi.title': { $regex: search, $options: 'i' } },
      { 'translations.te.title': { $regex: search, $options: 'i' } },
    ];
  }
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const total = await Article.countDocuments(query);
  const articles = await Article.find(query)
    .sort({ publishedAt: -1, createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .populate('categoryId', 'name slug')
    .populate('authorId', 'name');

  return res.status(200).json({
    success: true,
    data: articles,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

const getArticleById = asyncHandler(async (req, res) => {
  const article = await Article.findOne({
    _id: req.params.articleId,
    publisherId: req.publisherId,
    status: 'PUBLISHED',
  })
    .populate('categoryId', 'name slug')
    .populate('authorId', 'name');
  if (!article) {
    return res.status(404).json({ success: false, message: 'Article not found' });
  }

  const related = await Article.find({
    publisherId: req.publisherId,
    status: 'PUBLISHED',
    categoryId: article.categoryId?._id,
    _id: { $ne: article._id },
  })
    .sort({ publishedAt: -1 })
    .limit(5)
    .populate('categoryId', 'name slug')
    .populate('authorId', 'name');

  return res.status(200).json({ success: true, data: { article, related } });
});

const getDailyPapers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, date } = req.query;
  const query = { publisherId: req.publisherId, status: 'ACTIVE' };
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

  if (date) {
    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd = new Date(date + 'T23:59:59.999Z');
    query.paperDate = { $gte: dayStart, $lte: dayEnd };
  }

  const total = await DailyPaper.countDocuments(query);
  const papers = await DailyPaper.find(query)
    .sort({ paperDate: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  return res.status(200).json({
    success: true,
    data: papers,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

const getBreakingNews = asyncHandler(async (req, res) => {
  const news = await BreakingNews.find({
    publisherId: req.publisherId,
    status: 'ACTIVE',
    $or: [
      { startAt: { $lte: new Date() }, endAt: { $gte: new Date() } },
      { startAt: { $lte: new Date() }, endAt: null },
    ],
  })
    .sort({ priority: -1, createdAt: -1 })
    .limit(30);

  return res.status(200).json({ success: true, data: news });
});

const getAds = asyncHandler(async (req, res) => {
  const { position } = req.query;
  const query = {
    publisherId: req.publisherId,
    status: 'ACTIVE',
    $or: [
      { startDate: null, endDate: null },
      { startDate: { $lte: new Date() }, endDate: { $gte: new Date() } },
      { startDate: { $lte: new Date() }, endDate: null },
    ],
  };
  if (position) query.position = position;
  const ads = await Advertisement.find(query).sort({ priority: -1 });
  return res.status(200).json({ success: true, data: ads });
});

const trackImpression = asyncHandler(async (req, res) => {
  await Advertisement.updateOne({ _id: req.params.adId }, { $inc: { impressions: 1 } });
  return res.status(200).json({ success: true });
});

const trackClick = asyncHandler(async (req, res) => {
  await Advertisement.updateOne({ _id: req.params.adId }, { $inc: { clicks: 1 } });
  return res.status(200).json({ success: true });
});

const getVisitorCount = asyncHandler(async (req, res) => {
  const totalUsers = await Publisher.countDocuments({ status: { $in: ['ACTIVE', 'TRIAL'] } });
  const totalArticles = await Article.countDocuments({ publisherId: req.publisherId, status: 'PUBLISHED' });
  const totalPapers = await DailyPaper.countDocuments({ publisherId: req.publisherId, status: 'ACTIVE' });
  return res.status(200).json({
    success: true,
    data: { totalPublishers: totalUsers, totalArticles, totalPapers },
  });
});

const getTodayPaper = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let paper = await DailyPaper.findOne({
    publisherId: req.publisherId,
    status: 'ACTIVE',
    paperDate: { $gte: today, $lt: tomorrow },
  });

  if (!paper) {
    paper = await DailyPaper.findOne({
      publisherId: req.publisherId,
      status: 'ACTIVE',
      paperDate: { $lt: tomorrow },
    }).sort({ paperDate: -1 });
  }

  return res.status(200).json({ success: true, data: paper });
});

const getLegalPage = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const page = await LegalPage.findOne({ publisherId: req.publisherId, type });
  return res.status(200).json({ success: true, data: page || null });
});

module.exports = {
  resolvePublisher,
  getSiteData,
  getArticles,
  getArticleById,
  getDailyPapers,
  getBreakingNews,
  getAds,
  trackImpression,
  trackClick,
  getVisitorCount,
  getTodayPaper,
  getLegalPage,
};
