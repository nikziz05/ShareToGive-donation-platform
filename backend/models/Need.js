const mongoose = require('mongoose');

const needSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['clothes', 'food', 'toys', 'other'],
    required: true 
  },
  goal: { type: Number, required: true },
  current: { type: Number, default: 0 },
  urgent: { type: Boolean, default: false },
  ngo: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Need', needSchema);