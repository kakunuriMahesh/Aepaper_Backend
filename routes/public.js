const express = require('express');
const router = express.Router();
const Publisher = require('../models/Publisher');
const {
  resolvePublisher,
  getPublisherData,
  getArticles,
  getArticleById,
  getDailyPapers,
  getBreakingNews,
  getAds,
  trackImpression,
  trackClick,
  getVisitorCount,
  getTodayPaper,
} = require('../controllers/publicController');
const LegalPage = require('../models/LegalPage');

router.get('/publishers', async (req, res) => {
  try {
    const publishers = await Publisher.find({ status: { $in: ['ACTIVE', 'TRIAL'] } })
      .select('name shortName customDomain themeColor logoUrl supportedLanguages')
      .lean();
    return res.status(200).json({ success: true, data: publishers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch publishers' });
  }
});

router.use('/:domain', resolvePublisher);

router.get('/:domain', getPublisherData);
router.get('/:domain/articles', getArticles);
router.get('/:domain/articles/:articleId', getArticleById);
router.get('/:domain/daily-papers', getDailyPapers);
router.get('/:domain/breaking-news', getBreakingNews);
router.get('/:domain/ads', getAds);
router.get('/:domain/today-paper', getTodayPaper);
router.get('/:domain/stats', getVisitorCount);
router.get('/:domain/legal/:type', async (req, res) => {
  try {
    const page = await LegalPage.findOne({ publisherId: req.publisherId, type: req.params.type });
    if (!page) {
      return res.status(200).json({ success: true, data: null });
    }
    return res.status(200).json({ success: true, data: page });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch legal page' });
  }
});
router.post('/:domain/ads/:adId/impression', trackImpression);
router.post('/:domain/ads/:adId/click', trackClick);

module.exports = router;
