import React, { useState, useEffect } from 'react';
import { needsAPI, donationsAPI } from '../services/api';
import { Search, Heart, Package } from 'lucide-react';

const BrowseNeeds = () => {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [donationType, setDonationType] = useState('money');
  const [donationForm, setDonationForm] = useState({
    amount: '',
    items: '',
    quantity: '',
    deliveryMethod: 'drop-off',
    scheduleDate: '',
    scheduleTime: '',
    address: '',
    phone: '',
    notes: '',
    itemConditionConfirmed: false
  });

  useEffect(() => {
    loadNeeds();
  }, []);

  const loadNeeds = async () => {
    try {
      const response = await needsAPI.getAll();
      setNeeds(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading needs:', error);
      setLoading(false);
    }
  };

  const openDonationModal = (need, type) => {
    setSelectedNeed(need);
    setDonationType(type);
    setShowModal(true);
    setDonationForm({
      amount: '',
      items: '',
      quantity: '',
      deliveryMethod: 'drop-off',
      scheduleDate: '',
      scheduleTime: '',
      address: '',
      phone: '',
      notes: ''
    });
  };

  const handleDonationSubmit = async () => {
    // Validation
    if (donationType === 'money' && !donationForm.amount) {
      alert('Please enter donation amount');
      return;
    }

    if (donationType === 'physical') {
      if (!donationForm.items || !donationForm.quantity) {
        alert('Please fill in all required fields');
        return;
      }

      if (!donationForm.itemConditionConfirmed) {
        alert('Please confirm that your items are in good condition before donating.');
        return;
      }

      const quantity = parseInt(donationForm.quantity);
    
      if (isNaN(quantity) || quantity < 1) {
        alert('Quantity must be at least 1 item. Please enter a valid number.');
        return;
      }

      const remaining = selectedNeed.goal - selectedNeed.current;

      if (quantity > remaining) {
        alert(`This need only requires ${remaining} more items. Please reduce your donation quantity.`);
        return;
      }

      if (remaining <= 0) {
        alert('This need has already been fulfilled!');
        return;
      }

      if (!donationForm.scheduleDate || !donationForm.scheduleTime) {
        alert('Please select date and time');
        return;
      }

      if (donationForm.deliveryMethod === 'pickup' && !donationForm.address) {
        alert('Please enter pickup address');
        return;
      }

      if (donationForm.deliveryMethod === 'drop-off' && !donationForm.phone) {
        alert('Please enter contact number');
        return;
      }
    }

    try {
      const donationData = {
        needId: selectedNeed._id,
        type: donationType,
        ...donationForm
      };

      if (donationType === 'physical') {
        donationData.scheduleData = {
          deliveryMethod: donationForm.deliveryMethod,
          date: donationForm.scheduleDate,
          time: donationForm.scheduleTime,
          address: donationForm.address,
          phone: donationForm.phone
        };
      }

      await donationsAPI.create(donationData);
      alert('Donation submitted successfully!');
      setShowModal(false);
      setDonationForm({
        amount: '',
        items: '',
        quantity: '',
        deliveryMethod: 'drop-off',
        scheduleDate: '',
        scheduleTime: '',
        address: '',
        phone: '',
        notes: '',
        itemConditionConfirmed: false
      });
      loadNeeds();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error submitting donation';
      alert(errorMessage);
    }
  };

  const filteredNeeds = needs.filter(need => {
    const matchesSearch = need.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         need.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || need.category === filterCategory;
    return matchesSearch && matchesFilter;
  })
  .sort((a, b) => {
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Browse Needs</h1>
          <p className="text-gray-600">Find causes you care about and make a difference</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search needs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="clothes">Clothes</option>
            <option value="food">Food</option>
            <option value="toys">Toys</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNeeds.map(need => {
            const progress = (need.current / need.goal) * 100;
            const isComplete = need.current >= need.goal;
            
            return (
              <div key={need._id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">{need.title}</h3>
                    <span className="text-sm text-gray-500">{need.ngo}</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {need.urgent && (
                      <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">Urgent</span>
                    )}
                    {isComplete && (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Complete</span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 mb-4 text-sm">{need.description}</p>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span className="font-semibold">{need.current} / {need.goal} items</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-green-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  {isComplete && (
                    <p className="text-xs text-green-600 mt-1 font-medium">This need has been fulfilled! Thank you to all donors.</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openDonationModal(need, 'money')}
                    disabled={isComplete}
                    className={`flex-1 py-2 rounded-lg transition-colors font-medium text-sm ${
                      isComplete 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    Donate Money (₹)
                  </button>
                  <button
                    onClick={() => openDonationModal(need, 'physical')}
                    disabled={isComplete}
                    className={`flex-1 py-2 rounded-lg transition-colors font-medium text-sm ${
                      isComplete 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    Donate Items
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredNeeds.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">
              {searchTerm || filterCategory !== 'all' 
                ? 'No needs match your search criteria' 
                : 'No donation needs available at the moment'}
            </p>
            <p className="text-gray-400 text-sm">
              {searchTerm || filterCategory !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Check back soon for new opportunities to help'}
            </p>
          </div>
        )}
      </div>

      {/* Donation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {donationType === 'money' ? 'Donate Money' : 'Donate Items'}
            </h2>
            <p className="text-gray-600 mb-4">For: {selectedNeed?.title}</p>

            {selectedNeed && donationType === 'physical' && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">ℹ</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Items Remaining: {selectedNeed.goal - selectedNeed.current} of {selectedNeed.goal}
                    </p>
                    <p className="text-xs text-blue-700">
                      Already donated: {selectedNeed.current} items • 
                      Still needed: {selectedNeed.goal - selectedNeed.current} items
                    </p>
                    <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(selectedNeed.current / selectedNeed.goal) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {donationType === 'money' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter amount"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Items Description</label>
                    <input
                      type="text"
                      required
                      value={donationForm.items}
                      onChange={(e) => setDonationForm({ ...donationForm, items: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="E.g., Winter jackets, size 8-10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedNeed ? selectedNeed.goal - selectedNeed.current : undefined}
                      value={donationForm.quantity}
                      onChange={(e) => setDonationForm({ ...donationForm, quantity: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Number of items"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum: 1 item • Maximum allowed: {selectedNeed ? selectedNeed.goal - selectedNeed.current : 0} items
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                    <select
                      value={donationForm.deliveryMethod}
                      onChange={(e) => setDonationForm({ ...donationForm, deliveryMethod: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="drop-off">Drop-off</option>
                      <option value="pickup">Pickup Request</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={donationForm.scheduleDate}
                        onChange={(e) => setDonationForm({ ...donationForm, scheduleDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <input
                        type="time"
                        required
                        value={donationForm.scheduleTime}
                        onChange={(e) => setDonationForm({ ...donationForm, scheduleTime: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {donationForm.deliveryMethod === 'pickup' ? 'Pickup Address' : 'Your Contact Number'}
                    </label>
                    {donationForm.deliveryMethod === 'pickup' ? (
                      <textarea
                        required
                        value={donationForm.address}
                        onChange={(e) => setDonationForm({ ...donationForm, address: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows="2"
                        placeholder="Enter your address"
                      />
                    ) : (
                      <input
                        type="tel"
                        required
                        value={donationForm.phone}
                        onChange={(e) => setDonationForm({ ...donationForm, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    )}
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>Item Quality Check </h4>
    
                <div className="bg-white rounded-lg p-4 mb-3">
                  <p className="text-sm text-gray-700 font-medium mb-2">Before donating, please ensure your items are:</p>
                   <ul className="text-sm text-gray-600 space-y-1 ml-4">
                     <li>Clean and in good working condition</li>
                     <li>Free from major damage, tears, or stains</li>
                     <li>Safe and suitable for use</li>
                     <li>Items you would feel comfortable giving to a family member</li>
                   </ul>
                 </div>

               <label className="flex items-start space-x-3 cursor-pointer">
                 <input type="checkbox" checked={donationForm.itemConditionConfirmed} onChange={(e) => setDonationForm({ 
                 ...donationForm, itemConditionConfirmed: e.target.checked })}
                 className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
             />
               <span className="text-sm text-gray-700">
                <strong className="text-gray-900">I confirm</strong> that all items I'm donating are in good, clean, and usable condition. I understand that damaged or unsanitary items cannot be accepted.
               </span>
            </label>
    
    {!donationForm.itemConditionConfirmed && (
      <p className="text-xs text-red-600 mt-2 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Required: Please confirm item condition before submitting
      </p>
    )}
  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={donationForm.notes}
                  onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Any additional information"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleDonationSubmit}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-green-600 transition-all font-semibold"
                >
                  Confirm Donation
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseNeeds;