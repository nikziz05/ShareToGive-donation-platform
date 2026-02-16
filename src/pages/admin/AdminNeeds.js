import React, { useState, useEffect } from 'react';
import { needsAPI } from '../../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { APP_CONFIG } from '../../config';

const AdminNeeds = () => {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNeed, setEditingNeed] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'clothes',
    goal: '',
    urgent: false,
    ngo: APP_CONFIG.NGO_NAME
  });

  useEffect(() => {
    loadNeeds();
  }, []);

const loadNeeds = async () => {
  try {
    const response = await needsAPI.getAll();
    // Sort needs by priority: completed at end
    const sortedNeeds = response.data.sort((a, b) => {
      // Check completion status
      const aComplete = a.current >= a.goal;
      const bComplete = b.current >= b.goal;     
      // Priority 1: Push completed needs to the end
      if (aComplete && !bComplete) return 1;
      if (!aComplete && bComplete) return -1;    
      // Priority 2: Among active needs, urgent items first
      if (!aComplete && !bComplete) {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
      } 
      // Priority 3: Most recent first (within same category)
      return new Date(b.createdAt) - new Date(a.createdAt);
    }); 
    setNeeds(sortedNeeds);
    setLoading(false);
  } catch (error) {
    console.error('Error loading needs:', error);
    setLoading(false);
  }
};

  const openAddModal = () => {
    setEditingNeed(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      goal: '',
      urgent: false,
      ngo: 'Hope Foundation'
    });
    setShowModal(true);
  };

  const openEditModal = (need) => {
    setEditingNeed(need);
    setFormData({
      title: need.title,
      description: need.description,
      category: need.category,
      goal: need.goal,
      urgent: need.urgent,
      ngo: need.ngo
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNeed) {
        await needsAPI.update(editingNeed._id, formData);
        alert('Need updated successfully!');
      } else {
        await needsAPI.create(formData);
        alert('Need created successfully!');
      }
      setShowModal(false);
      loadNeeds();
    } catch (error) {
      alert('Error: ' + error.response?.data?.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this need?')) {
      try {
        await needsAPI.delete(id);
        alert('Need deleted successfully!');
        loadNeeds();
      } catch (error) {
        alert('Error deleting need: ' + error.response?.data?.message);
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Needs</h1>
            <p className="text-gray-600">Create and manage donation requests</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center space-x-2 shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Add Need</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {needs.map(need => {
            const progress = (need.current / need.goal) * 100;
            return (
              <div key={need._id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">{need.title}</h3>
                    <span className="text-sm text-gray-500">{need.ngo}</span>
                  </div>
                  {need.urgent && (
                    <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">Urgent</span>
                  )}
                </div>

                <p className="text-gray-600 mb-4 text-sm">{need.description}</p>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span className="font-semibold">{need.current} / {need.goal} items</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(need)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(need._id)}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingNeed ? 'Edit Need' : 'Add New Need'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="E.g., Winter Clothes for Children"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  <option value="clothes">Clothes</option>
                  <option value="food">Food</option>
                  <option value="toys">Toys</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="3"
                  placeholder="Describe the need in detail"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal (number of items)</label>
                <input
                  type="number"
                  required
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Target number of items"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={formData.urgent}
                  onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="urgent" className="ml-2 text-sm text-gray-700">Mark as urgent</label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
                >
                  {editingNeed ? 'Update Need' : 'Create Need'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNeeds;