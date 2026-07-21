const mongoose = require('mongoose');

const legalPageSchema = new mongoose.Schema(
  {
    publisherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publisher',
      required: [true, 'Publisher ID is required'],
    },
    type: {
      type: String,
      enum: ['terms', 'privacy', 'disclaimer'],
      required: [true, 'Page type is required'],
    },
    title: {
      type: Map,
      of: String,
      default: () => new Map([['en', '']]),
    },
    content: {
      type: Map,
      of: String,
      default: () => new Map([['en', '']]),
    },
  },
  { timestamps: true }
);

legalPageSchema.index({ publisherId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('LegalPage', legalPageSchema);
