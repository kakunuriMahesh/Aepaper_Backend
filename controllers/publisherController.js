const Publisher = require('../models/Publisher');
const User = require('../models/User');
const Article = require('../models/Article');
const Category = require('../models/Category');
const { asyncHandler, paginate, generateSlug } = require('../utils/helpers');

const DEFAULT_CATEGORIES = [
  { en: 'Politics', hi: 'राजनीति', te: 'రాజకీయాలు' },
  { en: 'Sports', hi: 'खेल', te: 'క్రీడలు' },
  { en: 'Business', hi: 'व्यापार', te: 'వ్యాపారం' },
  { en: 'Entertainment', hi: 'मनोरंजन', te: 'వినోదం' },
  { en: 'Technology', hi: 'तकनीक', te: 'సాంకేతికత' },
  { en: 'Lifestyle', hi: 'जीवनशैली', te: 'జీవనశైలి' },
  { en: 'National', hi: 'राष्ट्रीय', te: 'జాతీయ' },
  { en: 'International', hi: 'अंतर्राष्ट्रीय', te: 'అంతర్జాతీయ' },
  { en: 'Education', hi: 'शिक्षा', te: 'విద్య' },
  { en: 'Health', hi: 'स्वास्थ्य', te: 'ఆరోగ్యం' },
  { en: 'Opinion', hi: 'राय', te: 'అభిప్రాయం' },
  { en: 'District News', hi: 'जिला समाचार', te: 'జిల్లా వార్తలు' },
];

const seedDefaultCategories = async (publisherId, supportedLanguages) => {
  try {
    const Category = require('../models/Category');
    const { generateSlug } = require('../utils/helpers');
    for (const cat of DEFAULT_CATEGORIES) {
      const name = {};
      for (const lang of supportedLanguages) {
        name[lang] = cat[lang] || cat.en;
      }
      await Category.create({
        publisherId,
        name,
        slug: generateSlug(cat.en),
        displayOrder: DEFAULT_CATEGORIES.indexOf(cat) + 1,
      });
    }
  } catch (err) {
    console.error('Error seeding default categories:', err.message);
  }
};

const createPublisher = asyncHandler(async (req, res) => {
  const { name, shortName, customDomain, themeColor, logoUrl, appIconUrl, appIconLargeUrl, supportedLanguages, status } = req.body;

  if (!name || !shortName) {
    return res.status(400).json({ success: false, message: 'Name and short name are required' });
  }

  if (customDomain) {
    const existing = await Publisher.findOne({ customDomain });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Custom domain already in use' });
    }
  }

  const languages = Array.isArray(supportedLanguages) && supportedLanguages.length > 0
    ? supportedLanguages
    : ['en'];

  const publisher = await Publisher.create({
    name,
    shortName,
    customDomain,
    themeColor,
    logoUrl,
    appIconUrl,
    appIconLargeUrl,
    supportedLanguages: languages,
    status,
  });

  await seedDefaultCategories(publisher._id, languages);

  return res.status(201).json({ success: true, data: publisher });
});

const getAllPublishers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';

  const query = Publisher.find();
  if (search) {
    query.find({ name: { $regex: search, $options: 'i' } });
  }

  const total = await Publisher.countDocuments(search ? { name: { $regex: search, $options: 'i' } } : {});
  const publishers = await paginate(query.sort({ createdAt: -1 }), page, limit);

  return res.status(200).json({
    success: true,
    data: publishers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

const getPublisherById = asyncHandler(async (req, res) => {
  const publisher = await Publisher.findById(req.params.id);
  if (!publisher) {
    return res.status(404).json({ success: false, message: 'Publisher not found' });
  }
  return res.status(200).json({ success: true, data: publisher });
});

const updatePublisher = asyncHandler(async (req, res) => {
  const publisher = await Publisher.findById(req.params.id);
  if (!publisher) {
    return res.status(404).json({ success: false, message: 'Publisher not found' });
  }

  if (req.body.customDomain && req.body.customDomain !== publisher.customDomain) {
    const existing = await Publisher.findOne({ customDomain: req.body.customDomain });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Custom domain already in use' });
    }
  }

  const allowedFields = ['name', 'shortName', 'customDomain', 'themeColor', 'logoUrl', 'appIconUrl', 'appIconLargeUrl', 'supportedLanguages', 'status'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      publisher[field] = req.body[field];
    }
  });

  await publisher.save();
  return res.status(200).json({ success: true, data: publisher });
});

const deletePublisher = asyncHandler(async (req, res) => {
  const publisher = await Publisher.findById(req.params.id);
  if (!publisher) {
    return res.status(404).json({ success: false, message: 'Publisher not found' });
  }

  await Publisher.findByIdAndDelete(req.params.id);
  await User.deleteMany({ publisherId: req.params.id });
  await Article.deleteMany({ publisherId: req.params.id });
  await Category.deleteMany({ publisherId: req.params.id });

  return res.status(200).json({ success: true, message: 'Publisher deleted successfully' });
});

module.exports = { createPublisher, getAllPublishers, getPublisherById, updatePublisher, deletePublisher };
