const Category = require('../models/Category');
const Publisher = require('../models/Publisher');
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

const seedIfEmpty = async (publisherId) => {
  try {
    const count = await Category.countDocuments({ publisherId });
    if (count > 0) return;
    const publisher = await Publisher.findById(publisherId).lean();
    const langs = publisher?.supportedLanguages || ['en'];
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const cat = DEFAULT_CATEGORIES[i];
      const name = {};
      for (const l of langs) {
        name[l] = cat[l] || cat.en;
      }
      await Category.create({ publisherId, name, slug: generateSlug(cat.en), displayOrder: i + 1 });
    }
    console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories for publisher ${publisherId}`);
  } catch (err) {
    console.error('Auto-seed categories error:', err.message);
  }
};

const createCategory = asyncHandler(async (req, res) => {
  const { name, displayOrder } = req.body;

  if (!name || !name.en) {
    return res.status(400).json({ success: false, message: 'English name is required' });
  }

  if (!req.user.publisherId) {
    return res.status(400).json({ success: false, message: 'No publisher associated' });
  }

  const slug = generateSlug(name.en);

  const existing = await Category.findOne({ publisherId: req.user.publisherId, slug });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Category with this name already exists' });
  }

  const category = await Category.create({
    publisherId: req.user.publisherId,
    name,
    slug,
    displayOrder,
  });

  return res.status(201).json({ success: true, data: category });
});

const getAllCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;

  if (!req.user.publisherId) {
    return res.status(200).json({
      success: true,
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    });
  }

  const filter = { publisherId: req.user.publisherId };

  await seedIfEmpty(req.user.publisherId);

  const total = await Category.countDocuments(filter);
  const categories = await paginate(Category.find(filter).sort({ displayOrder: 1 }).lean(), page, limit);

  return res.status(200).json({
    success: true,
    data: categories,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  if (String(category.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const { name, displayOrder } = req.body;
  if (name) {
    category.name = name;
    if (name.en) {
      const newSlug = generateSlug(name.en);
      const existing = await Category.findOne({
        publisherId: req.user.publisherId,
        slug: newSlug,
        _id: { $ne: category._id },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Category with this name already exists' });
      }
      category.slug = newSlug;
    }
  }
  if (displayOrder !== undefined) category.displayOrder = displayOrder;

  await category.save();
  return res.status(200).json({ success: true, data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  if (String(category.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  await Category.findByIdAndDelete(req.params.id);
  return res.status(200).json({ success: true, message: 'Category deleted successfully' });
});

module.exports = { createCategory, getAllCategories, updateCategory, deleteCategory };
