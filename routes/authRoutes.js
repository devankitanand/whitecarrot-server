import express from 'express';
import User from '../models/User.js';
import Company from '../models/Company.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, companyName, companySlug } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const existingSlug = await User.findOne({ companySlug });
    if (existingSlug) {
      return res.status(400).json({ error: 'Company slug already taken' });
    }

    const user = new User({ email, password, companySlug });
    await user.save();

    const company = new Company({
      slug: companySlug,
      name: companyName,
      userId: user._id
    });
    await company.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: user._id, email: user.email, companySlug: user.companySlug } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, email: user.email, companySlug: user.companySlug } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

