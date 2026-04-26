import React, { useState, useEffect } from 'react';
import { donationsAPI } from '../services/api';
import { Package, Calendar, IndianRupee } from 'lucide-react';

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    try {
      const response = await donationsAPI.getMy();
      setDonations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading donations:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Donations</h1>
          <p className="text-gray-600">Track your contribution history</p>
        </div>

        {donations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">No donations yet</p>
            <p className="text-gray-400 text-sm mb-4">Start making a difference today!</p>
            <a href="/" className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              Browse Needs
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {donations.map(donation => (
              <div key={donation._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                      {donation.needId?.title || 'Donation'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      To: {donation.needId?.ngo || 'NGO'}
                    </p>

                    <div className="flex items-center space-x-6 text-sm">
                      {donation.type === 'money' ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <IndianRupee className="w-4 h-4" />
                          <span className="font-semibold">₹{donation.amount}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <Package className="w-4 h-4" />
                          <span className="font-semibold">
                            {donation.items} ({donation.quantity} items)
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {donation.notes && (
                      <p className="text-sm text-gray-600 mt-3 italic">
                        Note: {donation.notes}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                      donation.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {donation.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDonations;