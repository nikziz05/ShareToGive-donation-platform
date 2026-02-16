// Application Configuration
export const APP_CONFIG = {
  NGO_NAME: 'KindNest Foundation',
  NGO_EMAIL: 'kindnestorg1@gmail.com',
  NGO_PHONE: '+91 12345 XXXXX',
  NGO_ADDRESS: 'Patiala, Punjab, India'
};

// API Configuration - Using window.location to detect environment
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
