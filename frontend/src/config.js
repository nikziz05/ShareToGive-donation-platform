// Application Configuration
export const APP_CONFIG = {
  NGO_NAME: 'ShareToGive Foundation',
  NGO_EMAIL: 'sharetogiveorg@gmail.com',
  NGO_PHONE: '+91 12345 XXXXX',
  NGO_ADDRESS: 'Patiala, Punjab, India'
};

// API Configuration - Auto-detects localhost vs production
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1');

export const API_BASE_URL = isLocalhost
  ? 'http://localhost:5000/api'
  : 'https://kindnest1-backend.onrender.com/api';

export const config = {
  apiUrl: API_BASE_URL,
  environment: isLocalhost ? 'development' : 'production'
};