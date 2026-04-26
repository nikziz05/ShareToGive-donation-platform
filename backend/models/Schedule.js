const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['pickup', 'drop-off'],
    required: true
  },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  address: String,
  phone: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedVolunteer: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer'
  },
  otp: { type: String }, 
  otpVerified: { type: Boolean, default: false },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);