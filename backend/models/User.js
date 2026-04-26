const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'admin'], default: 'donor' },
  phone: String,
  address: String,
  profilePicture: String,  // stores image URL or base64
  preferences: {           //user preferences
    emailNotifications: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },
  resetPasswordToken: String,      
  resetPasswordExpire: Date,        
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);