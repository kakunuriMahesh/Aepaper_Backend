const DailyPaper = require('../models/DailyPaper');
const { asyncHandler, paginate } = require('../utils/helpers');

const createDailyPaper = asyncHandler(async (req, res) => {
  const { title, edition, paperDate, fileUrl, fileType, thumbnailUrl, pages, fileSize, pageImages } = req.body;

  if (!title || !paperDate) {
    return res.status(400).json({ success: false, message: 'Title and paper date are required' });
  }

  if (!req.user.publisherId) {
    return res.status(400).json({ success: false, message: 'No publisher associated' });
  }

  const paper = await DailyPaper.create({
    publisherId: req.user.publisherId,
    title,
    edition,
    paperDate,
    fileUrl,
    fileType,
    thumbnailUrl,
    pageImages: pageImages || [],
    pages,
    fileSize,
    uploadedBy: req.user.id,
  });

  return res.status(201).json({ success: true, data: paper });
});

const getAllDailyPapers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { status, search, startDate, endDate } = req.query;

  const filter = {};
  if (req.user.publisherId) {
    filter.publisherId = req.user.publisherId;
  }
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { edition: { $regex: search, $options: 'i' } },
    ];
  }
  if (startDate || endDate) {
    filter.paperDate = {};
    if (startDate) filter.paperDate.$gte = new Date(startDate);
    if (endDate) filter.paperDate.$lte = new Date(endDate);
  }

  const total = await DailyPaper.countDocuments(filter);
  const papers = await paginate(
    DailyPaper.find(filter).populate('uploadedBy', 'name').sort({ paperDate: -1 }).lean(),
    page,
    limit
  );

  return res.status(200).json({
    success: true,
    data: papers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

const getDailyPaperById = asyncHandler(async (req, res) => {
  const paper = await DailyPaper.findById(req.params.id).lean();
  if (!paper) {
    return res.status(404).json({ success: false, message: 'Daily paper not found' });
  }
  if (String(paper.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  return res.status(200).json({ success: true, data: paper });
});

const updateDailyPaper = asyncHandler(async (req, res) => {
  const paper = await DailyPaper.findById(req.params.id);
  if (!paper) {
    return res.status(404).json({ success: false, message: 'Daily paper not found' });
  }
  if (String(paper.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const allowedFields = ['title', 'edition', 'paperDate', 'fileUrl', 'fileType', 'thumbnailUrl', 'pageImages', 'pages', 'fileSize', 'status'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      paper[field] = req.body[field];
    }
  });

  await paper.save();
  return res.status(200).json({ success: true, data: paper });
});

const deleteDailyPaper = asyncHandler(async (req, res) => {
  const paper = await DailyPaper.findById(req.params.id);
  if (!paper) {
    return res.status(404).json({ success: false, message: 'Daily paper not found' });
  }
  if (String(paper.publisherId) !== String(req.user.publisherId)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  await DailyPaper.findByIdAndDelete(req.params.id);
  return res.status(200).json({ success: true, message: 'Daily paper deleted' });
});

const deleteMultipleDailyPapers = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No IDs provided' });
  }

  await DailyPaper.deleteMany({ _id: { $in: ids }, publisherId: req.user.publisherId });
  return res.status(200).json({ success: true, message: `${ids.length} papers deleted` });
});

module.exports = {
  createDailyPaper,
  getAllDailyPapers,
  getDailyPaperById,
  updateDailyPaper,
  deleteDailyPaper,
  deleteMultipleDailyPapers,
};
