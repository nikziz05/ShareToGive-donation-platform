const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  needId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Need',
    required: true 
  },
  type: { 
    type: String, 
    enum: ['money', 'physical'],
    required: true 
  },
  amount: Number,
  items: String,
  quantity: Number,
  deliveryMethod: { 
    type: String, 
    enum: ['drop-off', 'pickup']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'rejected'],
    default: 'pending'
  },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', donationSchema);