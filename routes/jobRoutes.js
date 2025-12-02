import express from 'express';
import Job from '../models/Job.js';
import Company from '../models/Company.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/company/:slug', async (req, res) => {
  try {
    const { location, jobType, search } = req.query;
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    let query = { companyId: company._id, status: 'open' };

    if (location) {
      query.location = new RegExp(location, 'i');
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (search) {
      query.title = new RegExp(search, 'i');
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/company/:companySlug/:jobSlug', async (req, res) => {
  try {
    const { companySlug, jobSlug } = req.params;
    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const job = await Job.findOne({ 
      companyId: company._id, 
      slug: jobSlug.toLowerCase().trim(),
      status: 'open'
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-jobs', authenticate, async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const jobs = await Job.find({ companyId: company._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/check-slug/:slug', authenticate, async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const { slug } = req.params;
    const normalizedSlug = slug.toLowerCase().trim();
    const existingJob = await Job.findOne({ 
      companyId: company._id, 
      slug: normalizedSlug 
    });
    
    res.json({ available: !existingJob });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/my-jobs', authenticate, async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (req.body.slug) {
      const existingJob = await Job.findOne({ 
        companyId: company._id, 
        slug: req.body.slug.toLowerCase().trim() 
      });
      if (existingJob) {
        return res.status(400).json({ error: 'Job slug already exists for this company' });
      }
    }

    const job = new Job({ ...req.body, companyId: company._id });
    if (job.slug) {
      job.slug = job.slug.toLowerCase().trim();
    }
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Job slug already exists for this company' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/my-jobs/:jobId', authenticate, async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (req.body.slug) {
      const existingJob = await Job.findOne({ 
        companyId: company._id, 
        slug: req.body.slug.toLowerCase().trim(),
        _id: { $ne: req.params.jobId }
      });
      if (existingJob) {
        return res.status(400).json({ error: 'Job slug already exists for this company' });
      }
      req.body.slug = req.body.slug.toLowerCase().trim();
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.jobId, companyId: company._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Job slug already exists for this company' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete('/my-jobs/:jobId', authenticate, async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const job = await Job.findOneAndDelete({ _id: req.params.jobId, companyId: company._id });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

