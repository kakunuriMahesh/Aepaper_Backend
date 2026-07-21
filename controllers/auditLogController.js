const AuditLog = require('../models/AuditLog');
const { asyncHandler, paginate } = require('../utils/helpers');

const getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const { action, userId, startDate, endDate } = req.query;

  const filter = {};

  if (req.user.role === 'TENANT_ADMIN') {
    filter.publisherId = req.user.publisherId;
  }

  if (action) filter.action = action;
  if (userId) filter.userId = userId;

  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }

  const total = await AuditLog.countDocuments(filter);
  const logs = await paginate(
    AuditLog.find(filter).sort({ timestamp: -1 }),
    page,
    limit
  );

  return res.status(200).json({
    success: true,
    data: logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

module.exports = { getAuditLogs };
