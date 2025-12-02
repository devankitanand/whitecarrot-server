import mongoose from 'mongoose';

const contentSectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['about', 'life', 'benefits', 'values', 'custom'],
    required: true
  },
  title: String,
  content: String,
  order: Number
});

const companySchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brand: {
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#1E40AF'
    },
    logo: String,
    banner: String,
    cultureVideo: String,
    subtitle: {
      type: String,
      default: 'Join our team and help shape the future'
    }
  },
  contentSections: [contentSectionSchema],
  published: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Company', companySchema);

