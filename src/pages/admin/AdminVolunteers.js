import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Mail, Phone, Calendar, UserCheck, UserX } from 'lucide-react';

// IMPORT THE API URL FROM CONFIG
const API_BASE_URL = 'https://kindnest1-backend.onrender.com/api';

const AdminVolunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    availability: '',
    availableDays: [],
    timeFrom: '',
    timeTo: '',
    status: 'active'
  });

  useEffect(() => {
    loadVolunteers();
  }, []);

  const loadVolunteers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/volunteers`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const data = await response.json();
      setVolunteers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading volunteers:', error);
      setLoading(false);
    }
  };

  // Format availability display
  const formatAvailability = (data) => {
    const days = data.availableDays || [];
    const timeFrom = data.timeFrom || '';
    const timeTo = data.timeTo || '';
    
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
    
    const timeText = timeFrom && timeTo ? ` ${timeFrom} - ${timeTo}` : '';
    return `${dayText}${timeText}`;
  };

  const openAddModal = () => {
    setEditingVolunteer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      availability: '',
      availableDays: [],
      timeFrom: '',
      timeTo: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const openEditModal = (volunteer) => {
    setEditingVolunteer(volunteer);
    setFormData({
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone,
      role: volunteer.role,
      availability: volunteer.availability || '',
      availableDays: [],
      timeFrom: '',
      timeTo: '',
      status: volunteer.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate at least one day is selected
    if (!formData.availableDays || formData.availableDays.length === 0) {
      alert('Please select at least one available day');
      return;
  }

  // Validate time range
  if (!formData.timeFrom || !formData.timeTo) {
    alert('Please specify both from and to times');
    return;
  }

  // Format availability before sending
  const availabilityText = formatAvailability(formData);
  
  // Handle email - if empty or "N/A", set to "N/A"
  const emailValue = formData.email.trim() === '' || formData.email.toLowerCase() === 'n/a' 
    ? 'N/A' 
    : formData.email;
    const dataToSend = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      availability: availabilityText,
      status: formData.status
    };
    
    try {
      const url = editingVolunteer 
        ? `${API_BASE_URL}/volunteers/${editingVolunteer._id}`
        : `${API_BASE_URL}/volunteers`;
      
      const method = editingVolunteer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        alert(editingVolunteer ? 'Volunteer updated successfully!' : 'Volunteer added successfully!');
        setShowModal(false);
        loadVolunteers();
      }
    } catch (error) {
      alert('Error: Failed to save volunteer');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this volunteer?')) {
      try {
        await fetch(`${API_BASE_URL}/volunteers/${id}`, {
          method: 'DELETE',
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        alert('Volunteer removed successfully!');
        loadVolunteers();
      } catch (error) {
        alert('Error removing volunteer');
      }
    }
  };

  const toggleStatus = async (volunteer) => {
    const newStatus = volunteer.status === 'active' ? 'inactive' : 'active';
    try {
      await fetch(`${API_BASE_URL}/volunteers/${volunteer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ ...volunteer, status: newStatus })
      });
      loadVolunteers();
    } catch (error) {
      alert('Error updating status');
    }
  };

  const stats = {
    total: volunteers.length,
    active: volunteers.filter(v => v.status === 'active').length,
    inactive: volunteers.filter(v => v.status === 'inactive').length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading volunteers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Volunteer Management</h1>
            <p className="text-gray-600">Manage your volunteer workforce</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center space-x-2 shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Add Volunteer</span>
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <Users className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-gray-500 text-sm">Total Volunteers</p>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6">
            <UserCheck className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-green-700 text-sm font-medium">Active</p>
            <p className="text-3xl font-bold text-green-900">{stats.active}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md p-6">
            <UserX className="w-8 h-8 text-gray-600 mb-2" />
            <p className="text-gray-700 text-sm font-medium">Inactive</p>
            <p className="text-3xl font-bold text-gray-900">{stats.inactive}</p>
          </div>
        </div>
        
        {volunteers.filter(v => v.status === 'pending').length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
             <h2 className="text-xl font-bold text-yellow-900 mb-4">
                Pending Approvals ({volunteers.filter(v => v.status === 'pending').length})
             </h2>
             <div className="space-y-3">
                {volunteers.filter(v => v.status === 'pending').map(v => (
                 <div key={v._id} className="bg-white rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{v.name}</p>
                    <p className="text-sm text-gray-600">{v.role} • {v.phone}</p>
                    {v.motivation && (
                      <p className="text-xs text-gray-500 mt-1 italic">"{v.motivation}"</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                     onClick={async () => {
                      if (window.confirm(`Approve ${v.name} as volunteer?`)) {
                       try {
                          console.log('Approving volunteer:', v.name);
                          console.log('Volunteer email:', v.email);
                          const response = await fetch(`${API_BASE_URL}/volunteers/${v._id}`, {
                          method: 'PUT',
                          headers: {
                              'Content-Type': 'application/json',
                              'x-auth-token': localStorage.getItem('token')
                          },
                          body: JSON.stringify({ ...v, status: 'active', sendEmail: true })
                       });
        
                      if (response.ok) {
                        const result = await response.json();
                        console.log('Approval response:', result);
                        alert(`${v.name} has been approved and notified via email!`);
                        loadVolunteers();
                      } else {
                        const error = await response.json();
                        console.error('Approval error:', error);
                        alert('Error approving volunteer: ' + error.message);
                      }
                    } catch (error) {
                        alert('Error: ' + error.message);
                   }
                 }
             }}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium"
             >
               Approve
             </button>
              <button
                 onClick={() => {
                  if (window.confirm(`Reject ${v.name}'s application?`)) {
                  handleDelete(v._id);
                 }
               }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-medium"
              >
               Reject
             </button>
             </div>
         </div>
       ))}
     </div>
   </div>
   )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Availability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {volunteers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No volunteers yet. Add volunteers to start managing your team.</p>
                    </td>
                  </tr>
                ) : (
                  volunteers.map(volunteer => (
                    <tr key={volunteer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {volunteer.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900">{volunteer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {volunteer.email || 'No email provided'}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {volunteer.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {volunteer.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {volunteer.availability || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(volunteer.joinedDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(volunteer)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                            volunteer.status === 'active'
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {volunteer.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => openEditModal(volunteer)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(volunteer._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editingVolunteer ? 'Edit Volunteer' : 'Add New Volunteer'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Jemma"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="jem@hotmail.com or N/A"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty or type "N/A" if not available</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role/Specialization <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select Role</option>
            <option value="Pickup Driver">Pickup Driver</option>
            <option value="Delivery Coordinator">Delivery Coordinator</option>
            <option value="Donation Sorter">Donation Sorter</option>
            <option value="Inventory Manager">Inventory Manager</option>
            <option value="Warehouse Helper">Warehouse Helper</option>
            <option value="Event Coordinator">Event Coordinator</option>
            <option value="Food Distribution">Food Distribution</option>
            <option value="Community Outreach">Community Outreach</option>
            <option value="Administrative Support">Administrative Support</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Availability <span className="text-red-500">*</span>
          </label>
          
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Select Days: <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-4 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <label key={day} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.availableDays?.includes(day) || false}
                    onChange={(e) => {
                      const days = formData.availableDays || [];
                      if (e.target.checked) {
                        setFormData({ 
                          ...formData, 
                          availableDays: [...days, day]
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          availableDays: days.filter(d => d !== day)
                        });
                      }
                    }}
                    className="rounded text-green-600"
                  />
                  <span>{day.substring(0, 3)}</span>
                </label>
              ))}
            </div>
            {formData.availableDays?.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Please select at least one day</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                From Time: <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.timeFrom || ''}
                onChange={(e) => setFormData({ ...formData, timeFrom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                To Time: <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.timeTo || ''}
                onChange={(e) => setFormData({ ...formData, timeTo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {formData.availableDays && formData.availableDays.length > 0 && formData.timeFrom && formData.timeTo && (
            <div className="mt-2 p-2 bg-green-50 rounded text-sm text-gray-700 border border-green-200">
              <strong>Availability Preview:</strong> {formatAvailability(formData)}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={!formData.availableDays || formData.availableDays.length === 0}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingVolunteer ? 'Update Volunteer' : 'Add Volunteer'}
          </button>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          <span className="text-red-500">*</span> Required fields
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminVolunteers;