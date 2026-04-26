import axios from 'axios';
import { API_BASE_URL } from '../config';

const API = axios.create({
  baseURL: API_BASE_URL // Changed from hardcoded URL
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  volunteerLogin: (phone) => API.post('/auth/volunteer-login', { phone }),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => API.put(`/auth/reset-password/${token}`, { password })
};

export const needsAPI = {
  getAll: () => API.get('/needs'),
  getOne: (id) => API.get(`/needs/${id}`),
  create: (data) => API.post('/needs', data),
  update: (id, data) => API.put(`/needs/${id}`, data),
  delete: (id) => API.delete(`/needs/${id}`)
};

export const donationsAPI = {
  getMy: () => API.get('/donations/my-donations'),
  getAll: () => API.get('/donations/admin'),
  create: (data) => API.post('/donations', data),
  updateStatus: (id, status) => API.put(`/donations/${id}/status`, { status })  
};

export const schedulesAPI = {
  getAll: () => API.get('/schedules'),
  update: (id, data) => API.put(`/schedules/${id}`, data)
};

export const inventoryAPI = {
  getAll: () => API.get('/inventory'),
  create: (data) => API.post('/inventory', data),
  update: (id, data) => API.put(`/inventory/${id}`, data),
  delete: (id) => API.delete(`/inventory/${id}`)
};

export const volunteersAPI = {
  getAll: () => API.get('/volunteers'),
  create: (data) => API.post('/volunteers', data),
  update: (id, data) => API.put(`/volunteers/${id}`, data),  
  delete: (id) => API.delete(`/volunteers/${id}`)             
};


export default API;