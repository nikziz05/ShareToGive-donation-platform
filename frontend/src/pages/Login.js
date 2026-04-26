import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Heart} from 'lucide-react';
import { authAPI } from '../services/api';

const Login = () => {
  const [activeTab, setActiveTab] = useState('user'); // 'user', 'admin', or 'volunteer'
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'donor',
    adminCode: '',
    volunteerPhone: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [error, setError] = useState('');
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  // Handle Volunteer Login FIRST - completely separate
  if (activeTab === 'volunteer') {
    if (!formData.volunteerPhone) {
      setError('Please enter your phone number');
      return;
    }
    
    try {
      console.log('=== VOLUNTEER LOGIN START ===');
      const response = await authAPI.volunteerLogin(formData.volunteerPhone);
      console.log('Volunteer API response:', response.data);
      
      if (!response.data.token) {
        throw new Error('No token received from server');
      }
      
      if (!response.data.user || response.data.user.role !== 'volunteer') {
        throw new Error('Invalid user data received');
      }
      
      // Store token
      localStorage.setItem('token', response.data.token);
      console.log('Token stored in localStorage');
      
      // Store volunteer ID
      if (response.data.user.volunteerId) {
        localStorage.setItem('volunteerId', response.data.user.volunteerId);
        console.log('Volunteer ID stored:', response.data.user.volunteerId);
      }
      
      console.log('Redirecting to volunteer dashboard...');
      
      // Use setTimeout to ensure state is saved before redirect
      setTimeout(() => {
        window.location.href = '/volunteer/dashboard';
      }, 100);
      
      return; // IMPORTANT: Stop execution here
    } catch (err) {
      console.error('=== VOLUNTEER LOGIN ERROR ===');
      console.error('Error details:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || err.message || 'Volunteer login failed');
      return; // IMPORTANT: Stop execution here
    }
  }
  
  // Handle Admin Login
  if (activeTab === 'admin') {
    const result = await login(formData.adminEmail, formData.adminPassword);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    return;
  }
  
  // Handle Donor Login/Register
  let result;
  if (isLogin) {
    result = await login(formData.email, formData.password);
  } else {
    result = await register(formData.name, formData.email, formData.password, formData.role, formData.adminCode, formData.phone);
  }

  if (result.success) {
    navigate('/');
  } else {
    setError(result.message);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">KindNest</h1>
          <p className="text-gray-600">Connecting generosity with those in need</p>
        </div>

        {/* Tab Selection - 3 tabs now */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setActiveTab('user');
              setError('');
            }}
            className={`flex-1 py-2 px-2 rounded-md font-medium transition-colors text-sm ${
              activeTab === 'user'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Donor
          </button>
          <button
            onClick={() => {
              setActiveTab('admin');
              setError('');
            }}
            className={`flex-1 py-2 px-2 rounded-md font-medium transition-colors text-sm ${
              activeTab === 'admin'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => {
              setActiveTab('volunteer');
              setError('');
            }}
            className={`flex-1 py-2 px-2 rounded-md font-medium transition-colors text-sm ${
              activeTab === 'volunteer'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Volunteer
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'admin' ? (
            // Admin Login Form
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                <input
                  type="email"
                  required
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="admin@kindnest1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
              >
                Login as Admin
              </button>

              <div className="mt-4 text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            </>
          ) : activeTab === 'volunteer' ? (
            // Volunteer Login Form
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"> Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.volunteerPhone}
                  onChange={(e) => setFormData({ ...formData, volunteerPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+91 XXXXX XXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use your registered phone number
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
              >
                Login as Volunteer
              </button>

              <div className="text-center text-sm text-gray-600">
                <p>Not a volunteer yet?</p>
                <Link
                  to="/volunteer-registration"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Register Here
                </Link>
              </div>
            </>
          ) : (
            // User (Donor) Login/Register Form
            <>
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jem"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Donor Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="jem@hotmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                <input
                 type="tel"
                 required={!isLogin}
                 value={formData.phone}
                 onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="+91 XXXXX XXXXX"
               />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="donor">Donor</option>
                    <option value="admin">NGO Admin</option>
                  </select>
                </div>
              )}

              {!isLogin && formData.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NGO Registration Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.adminCode}
                    onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter NGO secret code"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Contact KindNest admin for NGO registration code
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
              >
                {isLogin ? 'Login' : 'Register'}
              </button>

              {isLogin && (
                <div className="mt-4 text-center">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              )}

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;