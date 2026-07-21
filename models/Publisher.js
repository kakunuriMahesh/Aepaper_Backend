const mongoose = require('mongoose');

const publisherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Publisher name is required'],
      trim: true,
    },
    shortName: {
      type: String,
      required: [true, 'Short name is required'],
      trim: true,
    },
    customDomain: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    themeColor: {
      type: String,
      default: '#1A365D',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    appIconUrl: {
      type: String,
      default: '',
    },
    appIconLargeUrl: {
      type: String,
      default: '',
    },
    faviconUrl: {
      type: String,
      default: '',
    },
    supportedLanguages: {
      type: [String],
      default: ['en'],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one language is required',
      },
    },
    about: {
      type: String,
      default: '',
      trim: true,
    },
    contact: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'TRIAL'],
      default: 'TRIAL',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Publisher', publisherSchema);
