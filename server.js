require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');

const authRoutes = require('./routes/auth');
const publisherRoutes = require('./routes/publishers');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const articleRoutes = require('./routes/articles');
const auditLogRoutes = require('./routes/auditLogs');
const tenantRoutes = require('./routes/tenant');
const advertisementRoutes = require('./routes/advertisements');
const dailyPaperRoutes = require('./routes/dailyPapers');
const breakingNewsRoutes = require('./routes/breakingNews');
const legalPageRoutes = require('./routes/legalPages');
const uploadRoutes = require('./routes/upload');
const publicRoutes = require('./routes/public');
const DailyPaper = require('./models/DailyPaper');
const BreakingNews = require('./models/BreakingNews');

const Publisher = require('./models/Publisher');
const Article = require('./models/Article');
const Category = require('./models/Category');
const auth = require('./middleware/auth');
const authorize = require('./middleware/rbac');
const Advertisement = require('./models/Advertisement');

const app = express();

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    process.env.WEB_URL || 'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://epaper-web.vercel.app',
  ],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/publishers', publisherRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/daily-papers', dailyPaperRoutes);
app.use('/api/breaking-news', breakingNewsRoutes);
app.use('/api/legal-pages', legalPageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/public', publicRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/super-admin/stats', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const [totalPublishers, activePublishers, totalUsers, totalArticles] = await Promise.all([
      Publisher.countDocuments(),
      Publisher.countDocuments({ status: 'ACTIVE' }),
      User.countDocuments(),
      Article.countDocuments(),
    ]);
    return res.status(200).json({
      success: true,
      totalPublishers,
      activePublishers,
      totalUsers,
      totalArticles,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.get('/api/tenant-admin/stats', auth, authorize('TENANT_ADMIN'), async (req, res) => {
  try {
    const pid = req.user.publisherId;
    const filter = pid ? { publisherId: pid } : {};
    const [totalArticles, publishedArticles, draftArticles, totalAds, activeAds, totalStaff, editors, reporters, recentArticles, totalImpressions, totalClicks, totalAdRevenue, totalPapers, totalBreakingNews] = await Promise.all([
      Article.countDocuments(filter),
      Article.countDocuments({ ...filter, status: 'PUBLISHED' }),
      Article.countDocuments({ ...filter, status: 'DRAFT' }),
      Advertisement.countDocuments(filter),
      Advertisement.countDocuments({ ...filter, status: 'ACTIVE' }),
      User.countDocuments({ ...filter, role: { $in: ['TENANT_ADMIN', 'EDITOR', 'REPORTER'] } }),
      User.countDocuments({ ...filter, role: 'EDITOR' }),
      User.countDocuments({ ...filter, role: 'REPORTER' }),
      Article.find(filter).sort({ createdAt: -1 }).limit(5).select('translations status createdAt categoryId').populate('categoryId', 'name'),
      Advertisement.aggregate([
        ...(pid ? [{ $match: { publisherId: pid } }] : []),
        { $group: { _id: null, total: { $sum: '$impressions' } } },
      ]),
      Advertisement.aggregate([
        ...(pid ? [{ $match: { publisherId: pid } }] : []),
        { $group: { _id: null, total: { $sum: '$clicks' } } },
      ]),
      Advertisement.aggregate([
        ...(pid ? [{ $match: { publisherId: pid } }] : []),
        { $group: { _id: null, total: { $sum: '$totalRevenue' } } },
      ]),
      DailyPaper.countDocuments(filter),
      BreakingNews.countDocuments({ ...filter, status: 'ACTIVE' }),
    ]);
    return res.status(200).json({
      success: true,
      totalArticles,
      publishedArticles,
      draftArticles,
      totalAds,
      activeAds,
      totalStaff,
      editors,
      reporters,
      recentArticles,
      totalImpressions: totalImpressions[0]?.total || 0,
      totalClicks: totalClicks[0]?.total || 0,
      totalAdRevenue: totalAdRevenue[0]?.total || 0,
      totalPapers,
      totalBreakingNews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch tenant stats' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const seedSuperAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!existingAdmin) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@cms.com',
        passwordHash: 'Admin@123',
        role: 'SUPER_ADMIN',
        publisherId: null,
      });
      console.log('Default super admin created: admin@cms.com / Admin@123');
    }
  } catch (error) {
    console.error('Seeding error:', error.message);
  }
};

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedSuperAdmin();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
