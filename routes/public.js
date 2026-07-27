const express = require('express');
const router = express.Router();
const Publisher = require('../models/Publisher');
const {
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
} = require('../controllers/publicController');

router.get('/publishers', async (req, res) => {
  try {
    const publishers = await Publisher.find({ status: { $in: ['ACTIVE', 'TRIAL'] } })
      .select('name shortName customDomain themeColor logoUrl')
      .sort({ name: 1 });
    return res.status(200).json({ success: true, data: publishers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch publishers' });
  }
});

router.get('/:domain', resolvePublisher, getSiteData);
router.get('/:domain/articles', resolvePublisher, getArticles);
router.get('/:domain/articles/:articleId', resolvePublisher, getArticleById);
router.get('/:domain/daily-papers', resolvePublisher, getDailyPapers);
router.get('/:domain/breaking-news', resolvePublisher, getBreakingNews);
router.get('/:domain/ads', resolvePublisher, getAds);
router.get('/:domain/today-paper', resolvePublisher, getTodayPaper);
router.get('/:domain/stats', resolvePublisher, getVisitorCount);
router.get('/:domain/legal/:type', resolvePublisher, getLegalPage);
router.post('/:domain/ads/:adId/impression', resolvePublisher, trackImpression);
router.post('/:domain/ads/:adId/click', resolvePublisher, trackClick);

module.exports = router;
