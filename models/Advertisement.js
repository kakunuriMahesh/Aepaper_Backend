const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema(
  {
    publisherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publisher',
      required: [true, 'Publisher ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Advertisement title is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    linkUrl: {
      type: String,
      default: '',
    },
    position: {
      type: String,
      enum: ['HEADER', 'SIDEBAR', 'FOOTER', 'IN_ARTICLE', 'BETWEEN_PAGES'],
      default: 'SIDEBAR',
    },
    size: {
      type: String,
      enum: ['BANNER_728x90', 'SQUARE_300x250', 'SKYSCRAPER_160x600', 'MOBILE_320x50', 'CUSTOM'],
      default: 'SQUARE_300x250',
    },
    customWidth: {
      type: Number,
      default: null,
    },
    customHeight: {
      type: Number,
      default: null,
    },
    priority: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'EXPIRED'],
      default: 'ACTIVE',
    },
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    pricePerDay: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
  },
  { timestamps: true }
);

advertisementSchema.index({ publisherId: 1, status: 1, position: 1 });

module.exports = mongoose.model('Advertisement', advertisementSchema);
