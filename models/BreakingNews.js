const mongoose = require('mongoose');

const breakingNewsSchema = new mongoose.Schema(
  {
    publisherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publisher',
      required: [true, 'Publisher ID is required'],
    },
    headline: {
      type: String,
      required: [true, 'Headline is required'],
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    linkUrl: {
      type: String,
      default: '',
    },
    priority: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'EXPIRED'],
      default: 'ACTIVE',
    },
    startAt: {
      type: Date,
      default: Date.now,
    },
    endAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

breakingNewsSchema.index({ publisherId: 1, status: 1 });

module.exports = mongoose.model('BreakingNews', breakingNewsSchema);
