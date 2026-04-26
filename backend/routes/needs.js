const express = require('express');
const router = express.Router();
const Need = require('../models/Need');
const auth = require('../middleware/auth');

// Get all needs
router.get('/', async (req, res) => {
  try {
    const needs = await Need.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json(needs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get single need
router.get('/:id', async (req, res) => {
  try {
    const need = await Need.findById(req.params.id);
    if (!need) {
      return res.status(404).json({ message: 'Need not found' });
    }
    res.json(need);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create need (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const newNeed = new Need(req.body);
    const need = await newNeed.save();
    res.json(need);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update need (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const need = await Need.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!need) {
      return res.status(404).json({ message: 'Need not found' });
    }
    res.json(need);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete need (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const need = await Need.findByIdAndDelete(req.params.id);
    if (!need) {
      return res.status(404).json({ message: 'Need not found' });
    }
    res.json({ message: 'Need removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;