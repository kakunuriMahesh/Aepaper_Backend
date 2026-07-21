const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  publisherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Publisher',
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  userEmail: {
    type: String,
    default: '',
  },
  userRole: {
    type: String,
    default: '',
  },
  action: {
    type: String,
    enum: [
      'USER_LOGIN',
      'ARTICLE_CREATE',
      'ARTICLE_UPDATE',
      'ARTICLE_PUBLISH',
      'ARTICLE_UNPUBLISH',
      'SETTINGS_UPDATE',
      'USER_CREATE',
      'USER_UPDATE',
      'USER_DELETE',
      'CATEGORY_CREATE',
      'CATEGORY_UPDATE',
      'CATEGORY_DELETE',
      'PUBLISHER_CREATE',
      'PUBLISHER_UPDATE',
    ],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  targetCollection: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
