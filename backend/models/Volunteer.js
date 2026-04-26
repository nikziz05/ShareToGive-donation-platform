const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    sparse: true,  // allows multiple null/undefined values
    default: undefined  
  },
  phone: { type: String, required: true },
  role: { type: String, required: true },
  availability: String,
  address: String,
  motivation: String,
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  },
  joinedDate: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Volunteer', volunteerSchema);