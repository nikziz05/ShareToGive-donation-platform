import React, { useState, useEffect } from 'react';
import { donationsAPI } from '../../services/api';
import { Package, IndianRupee, Calendar, User, TrendingUp, MapPin, Truck, Users } from 'lucide-react';

const AdminDonations = () => {
  const [donations, setDonations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [donationToReject, setDonationToReject] = useState(null);
  const [inventoryAction, setInventoryAction] = useState('auto');
  const [location, setLocation] = useState('');
  const [existingLocations, setExistingLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [filteredVolunteers, setFilteredVolunteers] = useState([]); 

  useEffect(() => {
    loadDonations();
    loadLocations();
    loadVolunteers();
    loadSchedules();
  }, []);

  const loadDonations = async () => {
    try {
      const response = await donationsAPI.getAll();
      setDonations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading donations:', error);
      setLoading(false);
    }
  };
// Predefined rejection reasons
  const rejectionReasons = [
  'The need has already been fulfilled',
  'Items do not match current requirements',
  'Unable to accommodate pickup/drop-off at this time',
  'Items do not meet quality standards',
  'Custom (write your own reason)'
];

  const loadLocations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/inventory', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const inventory = await response.json();
      const locations = [...new Set(inventory.map(item => item.location))];
      setExistingLocations(locations);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadVolunteers = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/volunteers', {
      headers: { 'x-auth-token': localStorage.getItem('token') }
    });
    const data = await response.json();
    
    console.log('=== LOAD VOLUNTEERS ===');
    console.log('Total volunteers fetched:', data.length);
    console.log('Active volunteers:', data.filter(v => v.status === 'active').length);
    
    data.forEach(v => {
      console.log(`- ${v.name}: ${v.availability} (${v.status})`);
    });
    
    setVolunteers(data.filter(v => v.status === 'active'));
    console.log('Volunteers set in state');
  } catch (error) {
    console.error('Error loading volunteers:', error);
  }
};

  const loadSchedules = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/schedules', {
      headers: { 'x-auth-token': localStorage.getItem('token') }
    });
    const data = await response.json();
    setSchedules(data);
  } catch (error) {
    console.error('Error loading schedules:', error);
  }
};

const getSuggestedVolunteers = (scheduleDate, scheduleTime) => {
  console.log('\n=== GET SUGGESTED VOLUNTEERS START ===');
  console.log('Input - Date:', scheduleDate, 'Time:', scheduleTime);
  
  if (!scheduleDate || !scheduleTime) {
    console.warn('Missing date or time');
    return [];
  }
  
  // Parse the schedule date and time
  const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
  const dayOfWeek = scheduleDateTime.toLocaleDateString('en-US', { weekday: 'long' });
  const [scheduleHour, scheduleMin] = scheduleTime.split(':');
  const scheduleMinutes = parseInt(scheduleHour) * 60 + parseInt(scheduleMin);
  
  console.log('Parsed - Day:', dayOfWeek, 'Minutes:', scheduleMinutes);
  console.log('Checking', volunteers.length, 'volunteers...\n');
  
  // Day abbreviation mapping
  const dayAbbreviations = {
    'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday',
    'thu': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday',
    'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
    'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
  };
  
  const suggested = volunteers.filter(v => {
    console.log(`\nChecking ${v.name}:`);
    console.log(`  Status: ${v.status}`);
    console.log(`  Availability: ${v.availability}`);
    
    if (v.status !== 'active') {
      console.log(' Not active');
      return false;
    }
    
    if (!v.availability) {
      console.log(' No availability set');
      return false;
    }
    
    // Extract time
    const timeMatch = v.availability.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    if (!timeMatch) {
      console.log(' Invalid time format');
      return false;
    }
    
    const [volStartHour, volStartMin] = timeMatch[1].split(':');
    const [volEndHour, volEndMin] = timeMatch[2].split(':');
    const startMinutes = parseInt(volStartHour) * 60 + parseInt(volStartMin);
    const endMinutes = parseInt(volEndHour) * 60 + parseInt(volEndMin);
    
    console.log(`  Time: ${timeMatch[1]} - ${timeMatch[2]} (${startMinutes}-${endMinutes} mins)`);
    
    // Extract days
    const daysString = v.availability.split(/\d{2}:\d{2}/)[0].trim();
    console.log(`  Days string: "${daysString}"`);
    
    let availableDays = [];
    
    if (daysString.toLowerCase().includes('all days')) {
      availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      console.log('All days');
    } else if (daysString.toLowerCase().includes('weekdays')) {
      availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      console.log('Weekdays');
    } else if (daysString.toLowerCase().includes('weekends')) {
      availableDays = ['Saturday', 'Sunday'];
      console.log(' Weekends');
    } else {
      const dayParts = daysString.split(',').map(d => d.trim().toLowerCase());
      availableDays = dayParts
        .map(dayAbbr => {
          const cleanAbbr = dayAbbr.replace(/[^a-z]/gi, '').toLowerCase();
          return dayAbbreviations[cleanAbbr];
        })
        .filter(Boolean);
      console.log(`  Parsed days:`, availableDays);
    }
    
    // Check day match
    const isDayMatch = availableDays.includes(dayOfWeek);
    console.log(`  Day match (${dayOfWeek}): ${isDayMatch ? '✓' : '❌'}`);
    
    if (!isDayMatch) return false;
    
    // Check time match
    const isTimeMatch = scheduleMinutes >= startMinutes && scheduleMinutes <= endMinutes;
    console.log(`  Time match (${scheduleMinutes} in ${startMinutes}-${endMinutes}): ${isTimeMatch ? '✓' : '❌'}`);
    
    if (!isTimeMatch) return false;
    
    console.log(` ${v.name} IS AVAILABLE`);
    return true;
  });
  
  console.log(`\nTotal available: ${suggested.length}`);
  console.log('=== GET SUGGESTED VOLUNTEERS END ===\n');
  
  // Sort by role
  return suggested.sort((a, b) => {
    if (a.role === 'Pickup Driver' && b.role !== 'Pickup Driver') return -1;
    if (a.role !== 'Pickup Driver' && b.role === 'Pickup Driver') return 1;
    return 0;
  });
};

  const openInventoryModal = (donation) => {
    setSelectedDonation(donation);
    setShowInventoryModal(true);
    setInventoryAction('auto');
    setLocation('');
    setNewLocation('');
  };

const openVolunteerModal = async (donation) => {
  console.log('\n===========================================');
  console.log('OPENING VOLUNTEER MODAL - FULL DIAGNOSTIC');
  console.log('===========================================');
  
  console.log('1. Donation:', donation._id);
  console.log('2. Volunteers in state:', volunteers.length);
  
  if (volunteers.length === 0) {
    console.error('CRITICAL: No volunteers loaded in state!');
    alert('ERROR: No volunteers loaded. Check if loadVolunteers() is called in useEffect.');
    return;
  }
  
  setSelectedDonation(donation);
  
  try {
    console.log('3. Fetching schedules...');
    const response = await fetch('http://localhost:5000/api/schedules', {
      headers: { 'x-auth-token': localStorage.getItem('token') }
    });
    const allSchedules = await response.json();
    console.log('4. Schedules loaded:', allSchedules.length);
    
    const schedule = allSchedules.find(s => s.donationId?._id === donation._id);
    console.log('5. Schedule found:', schedule ? 'YES' : 'NO');
    
    if (!schedule) {
      console.error('No schedule for donation:', donation._id);
      alert('No pickup schedule found for this donation. Please create one first.');
      setFilteredVolunteers([]);
      setShowVolunteerModal(true);
      return;
    }
    
    console.log('6. Schedule details:');
    console.log('   - Date:', schedule.date);
    console.log('   - Time:', schedule.time);
    console.log('   - Type:', schedule.type);
    
    setScheduleId(schedule._id);
    
    console.log('7. Calling getSuggestedVolunteers...');
    console.log('   - Input date:', schedule.date);
    console.log('   - Input time:', schedule.time);
    console.log('   - Volunteers to filter:', volunteers.length);
    
    // Extract just the date part (YYYY-MM-DD) if it's an ISO string
    const dateOnly = schedule.date.split('T')[0];
    console.log('7. Calling getSuggestedVolunteers with:');
    console.log('   - Date:', dateOnly);
    console.log('   - Time:', schedule.time);
    console.log('   - Volunteers to check:', volunteers.length);
    const available = getSuggestedVolunteers(dateOnly, schedule.time);
    
    console.log('8. RESULT: Available volunteers:', available.length);
    if (available.length > 0) {
      console.log('Available:');
      available.forEach(v => console.log(`     - ${v.name} (${v.role}): ${v.availability}`));
    } else {
      console.log('No volunteers matched the criteria');
    }
    
    setFilteredVolunteers(available);
    
  } catch (error) {
    console.error('ERROR in openVolunteerModal:', error);
    setFilteredVolunteers([]);
  }
  
  console.log('9. Opening modal with', filteredVolunteers.length, 'volunteers');
  setShowVolunteerModal(true);
  setSelectedVolunteer('');
  console.log('===========================================\n');
};

  const handleStatusUpdate = async (donationId, status) => {
  const donation = donations.find(d => d._id === donationId);
  //If rejecting, show rejection modal
  if (status === 'rejected') {
    setDonationToReject(donation);
    setShowRejectionModal(true);
    setRejectionReason('');
    setCustomReason('');
    return;
  }
  
  // For physical donations being confirmed with PICKUP, skip inventory and go straight to volunteer assignment
  if (status === 'confirmed' && donation.type === 'physical' && donation.deliveryMethod === 'pickup') {
    if (window.confirm(`Confirm this donation and assign volunteer?`)) {
      try {
        // First confirm the donation
        await donationsAPI.updateStatus(donationId, status);
        // Then immediately open volunteer assignment
        openVolunteerModal(donation);
        return;
      } catch (error) {
        alert('Error updating donation status: ' + (error.response?.data?.message || error.message));
        return;
      }
    } else {
      return;
    }
  }
  
  // For DROP-OFF physical donations, show inventory modal
  if (status === 'confirmed' && donation.type === 'physical' && donation.deliveryMethod === 'drop-off') {
    openInventoryModal(donation);
    return;
  }
  // For money donations or other statuses, update directly
  if (window.confirm(`Are you sure you want to ${status} this donation?`)) {
    try {
      await donationsAPI.updateStatus(donationId, status);
      alert(`Donation ${status} successfully!`);
      loadDonations();
    } catch (error) {
      alert('Error updating donation status: ' + (error.response?.data?.message || error.message));
    }
  }
};

const handleRejectionSubmit = async () => {
  if (!rejectionReason) {
    alert('Please select a rejection reason');
    return;
  }

  if (rejectionReason === 'Custom (write your own reason)' && !customReason.trim()) {
    alert('Please write a custom rejection reason');
    return;
  }

  const finalReason = rejectionReason === 'Custom (write your own reason)' 
    ? customReason 
    : rejectionReason;

  try {
    await fetch(`http://localhost:5000/api/donations/${donationToReject._id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
      },
      body: JSON.stringify({
        status: 'rejected',
        rejectionReason: finalReason
      })
    });

    alert('Donation rejected. Email sent to donor with reason.');
    setShowRejectionModal(false);
    loadDonations();
  } catch (error) {
    alert('Error rejecting donation: ' + error.message);
  }
};

  const handleInventorySubmit = async () => {
    const finalLocation = location === 'new' ? newLocation : location;
    
    if (inventoryAction === 'auto' && !finalLocation) {
      alert('Please select or enter a location');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/donations/${selectedDonation._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({
          status: 'confirmed',
          inventoryAction: inventoryAction,
          location: inventoryAction === 'auto' ? finalLocation : null
        })
      });
      if (!response.ok) {
      throw new Error('Failed to update donation');
    }
      const result = await response.json();

      alert(`Donation confirmed! ${inventoryAction === 'auto' ? 'Inventory updated automatically.' : 'Please update inventory manually.'}`);
      setShowInventoryModal(false);
      
      // If it's a pickup, show volunteer assignment
      if (selectedDonation.deliveryMethod === 'pickup') {
        openVolunteerModal(selectedDonation);
      } else {
        loadDonations();
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleVolunteerAssignment = async () => {
    if (!selectedVolunteer) {
      alert('Please select a volunteer');
      return;
    }

    if (!scheduleId) {
      alert('No schedule found for this donation');
      return;
    }

    try {
      await fetch(`http://localhost:5000/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ 
          assignedVolunteer: selectedVolunteer,
          status: 'confirmed'
        })
      });
      alert('Volunteer assigned successfully! They will be notified.');
      setShowVolunteerModal(false);
      setDonations(prevDonations => 
      prevDonations.map(d => 
        d._id === selectedDonation._id 
          ? { ...d, volunteerAssigned: true } 
          : d
      )
    );   
    // update schedules state
    setSchedules(prevSchedules =>
      prevSchedules.map(s =>
        s._id === scheduleId
          ? { ...s, assignedVolunteer: { _id: selectedVolunteer }, status: 'confirmed' }
          : s
      )
    );
      loadDonations();
    } catch (error) {
      alert('Error assigning volunteer: ' + error.message);
    }
  };

  const stats = {
    total: donations.length,
    money: donations.filter(d => d.type === 'money').length,
    physical: donations.filter(d => d.type === 'physical').length,
    totalAmount: donations
      .filter(d => d.type === 'money')
      .reduce((sum, d) => sum + (d.amount || 0), 0)
  };

  const filteredDonations = donations.filter(d => {
    if (filter === 'all') return true;
    return d.type === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Donations Overview</h1>
          <p className="text-gray-600">Track and manage all donations</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-500" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-gray-500 text-sm">Total Donations</p>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6">
            <IndianRupee className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-blue-700 text-sm font-medium">Money Donations</p>
            <p className="text-3xl font-bold text-blue-900">{stats.money}</p>
            <p className="text-sm text-blue-600 mt-1">₹{stats.totalAmount.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6">
            <Package className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-green-700 text-sm font-medium">Physical Items</p>
            <p className="text-3xl font-bold text-green-900">{stats.physical}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6">
            <Calendar className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-purple-700 text-sm font-medium">This Month</p>
            <p className="text-3xl font-bold text-purple-900">
              {donations.filter(d => {
                const donationDate = new Date(d.createdAt);
                const now = new Date();
                return donationDate.getMonth() === now.getMonth();
              }).length}
            </p>
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('money')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'money'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Money ({stats.money})
          </button>
          <button
            onClick={() => setFilter('physical')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'physical'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Physical ({stats.physical})
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Need</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No donations found
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map(donation => (
                    <tr key={donation._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {donation.donorId?.name || 'Anonymous'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          donation.type === 'money'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {donation.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {donation.type === 'money' ? (
                          <span className="font-semibold">₹{donation.amount}</span>
                        ) : (
                          <span>{donation.items} ({donation.quantity} items)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {donation.type === 'physical' ? (
                          <div className="flex items-center text-sm">
                            {donation.deliveryMethod === 'pickup' ? (
                              <>
                                <Truck className="w-4 h-4 text-blue-500 mr-1" />
                                <span className="text-blue-700 font-medium">Pickup</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-4 h-4 text-green-500 mr-1" />
                                <span className="text-green-700 font-medium">Drop-off</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {donation.needId?.title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          donation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          donation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {donation.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
  {(!donation.status || donation.status === 'pending') && (
    <>
      <button
        onClick={() => handleStatusUpdate(donation._id, 'confirmed')}
        className="text-green-600 hover:text-green-800 font-medium"
      >
        Accept
      </button>
      <button
        onClick={() => handleStatusUpdate(donation._id, 'rejected')}
        className="text-red-600 hover:text-red-800 font-medium"
      >
        Reject
      </button>
    </>
  )}
  {donation.status === 'confirmed' && donation.type === 'physical' && donation.deliveryMethod === 'pickup' && (
    <>
      {/* Check if volunteer is already assigned */}
      {(() => {
        const schedule = schedules.find(s => s.donationId?._id === donation._id);
        const hasVolunteer = schedule && schedule.assignedVolunteer && schedule.status !== 'cancelled';
        
       if (hasVolunteer) {
          return (
            <div className="flex items-center text-green-600">
              <Users className="w-4 h-4 mr-1" />
              <span className="text-xs font-medium">Assigned</span>
            </div>
          );
          } else if (schedule && schedule.status === 'cancelled') {
          return (
            <button
              onClick={() => openVolunteerModal(donation)}
              className="text-orange-600 hover:text-orange-800 font-medium flex items-center"
            >
              <Users className="w-4 h-4 mr-1" />
              <span className="text-xs">Reassign</span>
            </button>
          );
          } else {
          return (
            <button
              onClick={() => openVolunteerModal(donation)}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <Users className="w-4 h-4 mr-1" />
              Assign
            </button>
        );
      }
      })()}
    </>
  )}
</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inventory Management Modal */}
      {showInventoryModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirm Donation & Update Inventory</h2>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 mb-1"><strong>Items:</strong> {selectedDonation.items}</p>
              <p className="text-sm text-gray-700"><strong>Quantity:</strong> {selectedDonation.quantity}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inventory Update Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="inventoryAction"
                      value="auto"
                      checked={inventoryAction === 'auto'}
                      onChange={(e) => setInventoryAction(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Automatic</p>
                      <p className="text-xs text-gray-500">Add to inventory immediately</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="inventoryAction"
                      value="manual"
                      checked={inventoryAction === 'manual'}
                      onChange={(e) => setInventoryAction(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Manual</p>
                      <p className="text-xs text-gray-500">Update inventory later</p>
                    </div>
                  </label>
                </div>
              </div>

              {inventoryAction === 'auto' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 mb-2"
                  >
                    <option value="">Select Location</option>
                    {existingLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                    <option value="new">+ Add New Location</option>
                  </select>

                  {location === 'new' && (
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="Enter new location name"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleInventorySubmit}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
                >
                  Confirm Donation
                </button>
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* Volunteer Assignment Modal */}
{showVolunteerModal && selectedDonation && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Assign Volunteer for Pickup</h2>
      
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-700 mb-1"><strong>Donor:</strong> {selectedDonation.donorId?.name}</p>
        <p className="text-sm text-gray-700 mb-1"><strong>Items:</strong> {selectedDonation.items}</p>
        <p className="text-sm text-gray-700"><strong>Quantity:</strong> {selectedDonation.quantity}</p>
      </div>

      {/* Schedule Info */}
{(() => {
  const schedule = schedules.find(s => s.donationId?._id === selectedDonation._id);
  
  if (!schedule) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-yellow-800">No schedule found for this donation</p>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 rounded-lg p-3 mb-4">
      <p className="text-sm text-gray-600 mb-1">
        <strong>Scheduled:</strong> {new Date(schedule.date).toLocaleDateString()} at {schedule.time}
      </p>
      <p className="text-sm text-gray-600">
        <strong>Day:</strong> {new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'long' })}
      </p>
    </div>
  );
})()}


{/* CRITICAL: Use filteredVolunteers NOT volunteers */}
{filteredVolunteers.length > 0 ? (
  <div className="mb-4">
    <div className="flex items-center space-x-2 mb-3">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <h3 className="font-semibold text-gray-800">
        Available Volunteers ({filteredVolunteers.length} of {volunteers.length})
      </h3>
    </div>
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {filteredVolunteers.map(v => (
        <label
          key={v._id}
          className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
            selectedVolunteer === v._id
              ? 'border-green-500 bg-green-100'
              : 'border-gray-300 bg-white hover:border-green-300 hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name="volunteer"
            value={v._id}
            checked={selectedVolunteer === v._id}
            onChange={(e) => setSelectedVolunteer(e.target.value)}
            className="w-4 h-4 text-green-600"
          />
          <div className="flex-1">
            <p className="font-medium text-gray-800">{v.name}</p>
            <p className="text-xs text-gray-600">{v.role} • {v.phone}</p>
            <p className="text-xs text-green-700 mt-1 font-medium">
              Available: {v.availability}
            </p>
          </div>
        </label>
      ))}
    </div>
  </div>
) : (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <p className="text-sm text-red-800 font-medium mb-2">No volunteers available</p>
    <p className="text-xs text-red-600 mb-1">
      Checked {volunteers.length} volunteers - none match this schedule time.
    </p>
    <p className="text-xs text-red-600">
      Please check volunteer availability settings in Volunteer Management.
    </p>
  </div>
)}

      <div className="flex space-x-3 pt-4">
        <button
          onClick={handleVolunteerAssignment}
          disabled={!selectedVolunteer || filteredVolunteers.length === 0}
          className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Assign Volunteer
        </button>
        <button
          onClick={() => {
            setShowVolunteerModal(false);
            loadDonations();
          }}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Skip
        </button>
      </div>
    </div>
  </div>
)}
{/*Rejection Reason Modal*/}
{showRejectionModal && donationToReject && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Reject Donation</h2>
      
      <div className="bg-red-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-700 mb-1"><strong>Donor:</strong> {donationToReject.donorId?.name}</p>
        <p className="text-sm text-gray-700 mb-1"><strong>Items:</strong> {donationToReject.type === 'money' ? `₹${donationToReject.amount}` : `${donationToReject.items} (${donationToReject.quantity} items)`}</p>
        <p className="text-sm text-gray-700"><strong>For:</strong> {donationToReject.needId?.title}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Rejection Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Choose a reason</option>
            {rejectionReasons.map((reason, index) => (
              <option key={index} value={reason}>{reason}</option>
            ))}
          </select>
        </div>

        {rejectionReason === 'Custom (write your own reason)' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="4"
              placeholder="Explain why this donation cannot be accepted."
            />
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            An email will be sent to {donationToReject.donorId?.email || 'the donor'} with this rejection reason.
          </p>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            onClick={handleRejectionSubmit}
            className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold"
          >
            Reject & Send Email
          </button>
          <button
            onClick={() => {
              setShowRejectionModal(false);
              setDonationToReject(null);
            }}
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

export default AdminDonations;