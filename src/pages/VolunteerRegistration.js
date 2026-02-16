import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, User, Mail, Phone, Calendar, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';

const VolunteerRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    availableDays: [],
    timeFrom: '',
    timeTo: '',
    address: '',
    motivation: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const roles = [
    'Pickup Driver',
    'Delivery Coordinator',
    'Donation Sorter',
    'Inventory Manager',
    'Warehouse Helper',
    'Event Coordinator',
    'Food Distribution',
    'Community Outreach',
    'Administrative Support',
    'Other'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDayToggle = (day) => {
    if (formData.availableDays.includes(day)) {
      setFormData({
        ...formData,
        availableDays: formData.availableDays.filter(d => d !== day)
      });
    } else {
      setFormData({
        ...formData,
        availableDays: [...formData.availableDays, day]
      });
    }
  };

  const formatAvailability = () => {
    const days = formData.availableDays;
    let dayText = '';
    
    if (days.length === 7) {
      dayText = 'All days';
    } else if (days.length === 5 && !days.includes('Saturday') && !days.includes('Sunday')) {
      dayText = 'Weekdays';
    } else if (days.length === 2 && days.includes('Saturday') && days.includes('Sunday')) {
      dayText = 'Weekends';
    } else if (days.length > 0) {
      dayText = days.map(d => d.substring(0, 3)).join(', ');
    }
    
    return `${dayText} ${formData.timeFrom} - ${formData.timeTo}`;
  };

  const handleSubmit = async (e) => {
    if (formData.availableDays.length === 0) {
      alert('Please select at least one available day');
      return;
    }

    if (!formData.timeFrom || !formData.timeTo) {
      alert('Please specify your available time');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/volunteers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          availability: formatAvailability(),
          status: 'pending' // Admin approval required
        })
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: '',
          availableDays: [],
          timeFrom: '',
          timeTo: '',
          address: '',
          motivation: ''
        });
      } else {
        const error = await response.json();
        alert('Registration failed: ' + error.message);
      }
    } catch (error) {
      alert('Error submitting registration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Registration Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your interest in volunteering with KindNest! Our team will review your application and contact you soon.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-green-600 transition-all font-semibold"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Become a Volunteer</h1>
            <p className="text-gray-600">Join KindNest and make a difference in your community</p>
          </div>

          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jemma"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="jem@hotmail.com or N/A"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty if you don't have an email</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Your full address"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Volunteer Role</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                <Calendar className="w-5 h-5 inline mr-2" />
                Availability
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Days <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {days.map(day => (
                      <label
                        key={day}
                        className={`flex items-center justify-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.availableDays.includes(day)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.availableDays.includes(day)}
                          onChange={() => handleDayToggle(day)}
                          className="sr-only"
                        />
                        <span className="font-medium text-sm">{day.substring(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.timeFrom}
                      onChange={(e) => setFormData({ ...formData, timeFrom: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Until <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.timeTo}
                      onChange={(e) => setFormData({ ...formData, timeTo: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {formData.availableDays.length > 0 && formData.timeFrom && formData.timeTo && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Your Availability:</strong> {formatAvailability()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Motivation */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tell Us About Yourself</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why do you want to volunteer? <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Share your motivation for volunteering with KindNest"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By submitting this form, you agree to be contacted by KindNest regarding volunteer opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerRegistration;