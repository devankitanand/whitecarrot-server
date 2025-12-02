import express from 'express';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/public/:slug', async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-company', authenticate, async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/my-company', authenticate, async (req, res) => {
  try {
    const company = await Company.findOneAndUpdate(
      { userId: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/my-company/sections', authenticate, async (req, res) => {
  try {
    const { type, title, content } = req.body;
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const maxOrder = company.contentSections.length > 0
      ? Math.max(...company.contentSections.map(s => s.order || 0))
      : -1;

    company.contentSections.push({
      type,
      title,
      content,
      order: maxOrder + 1
    });
    await company.save();
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/my-company/sections/:sectionId', authenticate, async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const section = company.contentSections.id(req.params.sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    Object.assign(section, req.body);
    await company.save();
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/my-company/sections/:sectionId', authenticate, async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    company.contentSections.id(req.params.sectionId).deleteOne();
    await company.save();
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/my-company/sections/reorder', authenticate, async (req, res) => {
  try {
    const { sectionIds } = req.body;
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    sectionIds.forEach((id, index) => {
      const section = company.contentSections.id(id);
      if (section) {
        section.order = index;
      }
    });

    await company.save();
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/check-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const normalizedSlug = slug.toLowerCase().trim();
    const [company, user] = await Promise.all([
      Company.findOne({ slug: normalizedSlug }),
      User.findOne({ companySlug: normalizedSlug })
    ]);
    res.json({ available: !company && !user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/my-company/slug', authenticate, async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug || !slug.match(/^[a-z0-9\-]+$/)) {
      return res.status(400).json({ error: 'Invalid slug format' });
    }

    const normalizedSlug = slug.toLowerCase().trim();
    const existingCompany = await Company.findOne({ slug: normalizedSlug });
    
    if (existingCompany && existingCompany.userId.toString() !== req.userId.toString()) {
      return res.status(400).json({ error: 'Slug already taken' });
    }

    // Check if slug is already taken by another user
    const existingUser = await User.findOne({ companySlug: normalizedSlug });
    if (existingUser && existingUser._id.toString() !== req.userId.toString()) {
      return res.status(400).json({ error: 'Slug already taken' });
    }

    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Update company slug
    company.slug = normalizedSlug;
    await company.save();

    // Update user companySlug
    const user = await User.findById(req.userId);
    if (user) {
      user.companySlug = normalizedSlug;
      await user.save();
    }

    res.json({ 
      company,
      user: { id: user._id, email: user.email, companySlug: user.companySlug }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Slug already taken' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;

