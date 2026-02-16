import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Package, Phone, Mail, CheckCircle, AlertCircle, User} from 'lucide-react';

const VolunteerDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [volunteer, setVolunteer] = useState(null);
  const [otpInput, setOtpInput] = useState({});

  useEffect(() => {
    loadVolunteerData();
  }, []);

  const loadVolunteerData = async () => {
    try {
      // Get volunteer ID from localStorage (set during login)
      const volunteerId = localStorage.getItem('volunteerId');
      
      if (!volunteerId) {
        alert('Please login as a volunteer first');
        return;
      }

      // Fetch volunteer details
      const volResponse = await fetch(`http://localhost:5000/api/volunteers/${volunteerId}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const volData = await volResponse.json();
      setVolunteer(volData);

      // Fetch assigned schedules
      const schedResponse = await fetch(`http://localhost:5000/api/schedules/volunteer/${volunteerId}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const schedData = await schedResponse.json();
      // Sort assignments: completed last, urgent first
    const sortedAssignments = schedData.sort((a, b) => {
      // Priority 1: Completed at bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      // Priority 2: Pending before confirmed
      const statusPriority = { 'pending': 1, 'confirmed': 2, 'cancelled': 3 };
      if (a.status !== b.status && a.status !== 'completed' && b.status !== 'completed') {
        return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
      }
      
      // Priority 3: Sort by date and time (earliest first for active assignments)
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA - dateB; // Ascending order for volunteers
    });
      setAssignments(schedData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading volunteer data:', error);
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (scheduleId, status) => {
    try {
      await fetch(`http://localhost:5000/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ status })
      });
      alert(`Assignment marked as ${status}!`);
      loadVolunteerData();
    } catch (error) {
      alert('Error updating status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    confirmed: assignments.filter(a => a.status === 'confirmed').length,
    completed: assignments.filter(a => a.status === 'completed').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Volunteer Dashboard</h1>
          <p className="text-gray-600">Welcome back, {volunteer?.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <Package className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-gray-500 text-sm">Total Assignments</p>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-md p-6">
            <AlertCircle className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="text-yellow-700 text-sm font-medium">Pending</p>
            <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6">
            <Calendar className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-blue-700 text-sm font-medium">Confirmed</p>
            <p className="text-3xl font-bold text-blue-900">{stats.confirmed}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6">
            <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-green-700 text-sm font-medium">Completed</p>
            <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">My Assignments</h2>

          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">No assignments yet</p>
              <p className="text-gray-400 text-sm">You'll be notified when you're assigned to a pickup</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map(assignment => (
                <div key={assignment._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {assignment.type === 'pickup' ? 'Pickup' : 'Drop-off'} Request
                      </h3>
                      <p className="text-sm text-gray-500">
                        Assigned: {new Date(assignment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      assignment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      assignment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{new Date(assignment.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{assignment.time}</span>
                      </div>
                      {assignment.address && (
                        <div className="flex items-start text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                          <span>{assignment.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs text-gray-500 mb-1">Donor Contact</p>
                        {/* Donor Name */}
    <div className="flex items-center text-sm text-gray-700 mb-2">
      <User className="w-4 h-4 mr-2 text-blue-500" />
      <span><strong>Name:</strong> {assignment.donorId?.name || 'Not provided'}</span>
    </div>
    
    {/* Donor Phone from Schedule */}
    <div className="flex items-center text-sm text-gray-700 mb-2">
      <Phone className="w-4 h-4 mr-2 text-blue-500" />
      <span><strong>Phone:</strong> </span>
      {(() => {
      // Priority: schedule.phone > donorId.phone > "Not provided"
      const phoneNumber = assignment.phone || assignment.donorId?.phone;
      
      if (phoneNumber && phoneNumber !== 'Not provided') {
        return (
          <a 
            href={`tel:${phoneNumber}`}
            className="text-blue-600 hover:text-blue-800 font-medium ml-1 underline"
          >
            {phoneNumber}
          </a>
        );
      } else {
        return <span className="text-red-600 ml-1 font-medium">No phone number</span>;
      }
    })()}
    </div>
                        {assignment.donorId?.email && assignment.donorId.email !== 'N/A' && (
                          <div className="flex items-center text-sm text-gray-700 mt-1">
                            <Mail className="w-4 h-4 mr-2 text-blue-500" />
                            <span><strong>Email:</strong> </span>
        <a 
          href={`mailto:${assignment.donorId.email}`}
          className="text-blue-600 hover:text-blue-800 font-medium ml-1 underline text-xs"
        >
          {assignment.donorId.email}
        </a>
        </div>
                        )}
                        {/* Warning if no contact info */}
  {!assignment.phone && !assignment.donorId?.phone && (
    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
      <p className="text-xs text-red-700">
        No phone number available. Contact admin for donor details.
      </p>
    </div>
  )}
                      </div>
                    </div>
                  </div>

                  {assignment.notes && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Notes:</p>
                      <p className="text-sm text-gray-700">{assignment.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {assignment.status === 'confirmed' && (
                    <div className="flex space-x-4">
                     {/* OTP Verification Box */}
    {!assignment.otpVerified && (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
          Verify Pickup Code
        </h4>
        <p className="text-sm text-gray-600 mb-3">
          Ask the donor for their 6-digit verification code
        </p>
        <input
          type="text"
          maxLength="6"
          value={otpInput[assignment._id] || ''}
          onChange={(e) => setOtpInput({
            ...otpInput,
            [assignment._id]: e.target.value.replace(/\D/g, '')
          })}
          className="w-full text-center text-3xl font-bold tracking-widest border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="000000"
        />
        
       <div className="flex space-x-3 mt-4">
          <button
            onClick={async () => {
              const otp = otpInput[assignment._id];
              if (!otp || otp.length !== 6) {
                alert('Please enter the 6-digit verification code');
                return;
              }
              
              const verified = await verifyOTP(assignment._id, otp);
              if (!verified) {
                return;
              }
              
              if (window.confirm('Mark this pickup as completed?')) {
                updateAssignmentStatus(assignment._id, 'completed');
              }
            }}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Verify & Complete</span>
          </button>
          
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel this assignment?\n\nThe admin and donor will be notified, and a new volunteer will need to be assigned.')) {
                updateAssignmentStatus(assignment._id, 'cancelled');
              }
            }}
            className="px-6 py-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            Cancel Assignment
          </button>
        </div>
      </div>
    )}
    
    {assignment.otpVerified && (
      <>
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 flex items-center">
        <span className="font-medium text-green-800">Code verified - Ready to complete</span>
      </div>
    
    
    <div className="flex space-x-3">
      <button
        onClick={async () => {
          // Then mark as completed
          if (window.confirm('Mark this pickup as completed?')) {
            updateAssignmentStatus(assignment._id, 'completed');
          }
        }}
        className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center space-x-2"
      >
        <CheckCircle className="w-6 h-6" />
        <span>'Mark as Completed' </span>
      </button>
    </div>
    </>
    )}
  </div>
)}

                  {assignment.status === 'pending' && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => updateAssignmentStatus(assignment._id, 'confirmed')}
                        className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        Accept Assignment
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to reject this assignment?')) {
                            updateAssignmentStatus(assignment._id, 'cancelled');
                          }
                        }}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

//OTP verification function
const verifyOTP = async (scheduleId, otp) => {
  try {
    const response = await fetch(`http://localhost:5000/api/schedules/${scheduleId}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
      },
      body: JSON.stringify({ otp })
    });
    
    if (response.ok) {
      return true;
    } else {
      const error = await response.json();
      alert(error.message);
      return false;
    }
  } catch (error) {
    alert('Error verifying OTP');
    return false;
  }
};

export default VolunteerDashboard;