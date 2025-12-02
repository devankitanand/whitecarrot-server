import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  department: String,
  location: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  }
}, {
  timestamps: true
});

jobSchema.index({ companyId: 1, slug: 1 }, { unique: true, sparse: true });

export default mongoose.model('Job', jobSchema);

