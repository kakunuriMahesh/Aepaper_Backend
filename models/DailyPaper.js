const mongoose = require('mongoose');

const dailyPaperSchema = new mongoose.Schema(
  {
    publisherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publisher',
      required: [true, 'Publisher ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    edition: {
      type: String,
      default: '',
      trim: true,
    },
    paperDate: {
      type: Date,
      required: [true, 'Paper date is required'],
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      enum: ['PDF', 'JPG', 'JPEG', 'PNG'],
      default: 'PDF',
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    pageImages: {
      type: [String],
      default: [],
    },
    pages: {
      type: Number,
      default: 1,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

dailyPaperSchema.pre('validate', function (next) {
  if (!this.fileUrl && (!this.pageImages || this.pageImages.length === 0)) {
    this.invalidate('fileUrl', 'Either file URL or page images are required');
  }
  next();
});

dailyPaperSchema.index({ publisherId: 1, paperDate: -1 });
dailyPaperSchema.index({ publisherId: 1, status: 1 });

module.exports = mongoose.model('DailyPaper', dailyPaperSchema);
