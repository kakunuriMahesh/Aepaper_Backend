const mongoose = require('mongoose');
const { generateSlug } = require('../utils/helpers');

const categorySchema = new mongoose.Schema(
  {
    publisherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publisher',
      required: [true, 'Publisher ID is required'],
    },
    name: {
      type: Map,
      of: String,
      required: [true, 'Name is required'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

categorySchema.index({ publisherId: 1, slug: 1 }, { unique: true });

categorySchema.pre('validate', function (next) {
  if (this.name && this.name.get && this.name.get('en') && (!this.slug || this.isModified('name'))) {
    this.slug = generateSlug(this.name.get('en'));
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
