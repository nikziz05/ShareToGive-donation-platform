import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Package, User, Phone, Mail } from 'lucide-react';

const DonorSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/schedules/my-schedules', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const data = await response.json();
      //Sort schedules: completed last, then by date (newest first)
    const sortedSchedules = data.sort((a, b) => {
      // Priority 1: Completed schedules go to bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      // Priority 2: Sort by date and time (newest first)
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB - dateA; // Descending order
    });
      setSchedules(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading schedules...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Schedules</h1>
          <p className="text-gray-600">Your pickup and drop-off appointments</p>
        </div>

        {schedules.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">No schedules yet</p>
            <p className="text-gray-400 text-sm">
              Make a physical donation to schedule a pickup or drop-off
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {schedules.map((schedule) => (
              <div key={schedule._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      Donation Schedule
                    </h3>
                    <p className="text-sm text-gray-500">
                      Type: {schedule.type === 'pickup' ? 'Pickup' : 'Drop-off'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                    schedule.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    schedule.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {schedule.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{new Date(schedule.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{schedule.time}</span>
                  </div>

                  {schedule.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{schedule.address}</span>
                    </div>
                  )}

                  {schedule.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{schedule.phone}</span>
                    </div>
                  )}

                  {schedule.notes && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600 italic">
                        Note: {schedule.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Volunteer Information */}
                {schedule.assignedVolunteer && (
                  <div className="mt-4 pt-4 border-t bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Assigned Volunteer
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium text-gray-800">
                          {schedule.assignedVolunteer.name}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Role:</span> {schedule.assignedVolunteer.role}
                      </p>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 text-blue-500" />
                        <a 
                          href={`tel:${schedule.assignedVolunteer.phone}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {schedule.assignedVolunteer.phone}
                        </a>
                      </div>
                      {schedule.assignedVolunteer.email && schedule.assignedVolunteer.email !== 'N/A' &&  (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-blue-500" />
                          <a 
                            href={`mailto:${schedule.assignedVolunteer.email}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {schedule.assignedVolunteer.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* After volunteer information, ADD: */}
{schedule.otp && !schedule.otpVerified && (
  <div className="mt-4 pt-4 border-t bg-green-50 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
      Pickup Verification Code
    </h4>
    <div className="text-center p-6 bg-white rounded-lg border-4 border-dashed border-green-500">
      <p className="text-xs text-gray-500 mb-2">SHARE WITH VOLUNTEER</p>
      <p className="text-5xl font-bold text-green-600 tracking-widest mb-2">
        {schedule.otp}
      </p>
      <p className="text-xs text-gray-500">Valid for this pickup only</p>
    </div>
    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
      <p className="text-xs text-yellow-800">
        <strong>Important:</strong> Only share this code with the volunteer in person. Do not send via phone or message.
      </p>
    </div>
  </div>
)}

{schedule.otpVerified && (
  <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded flex items-center">
    <span className="text-sm font-medium text-green-800">Pickup verified successfully</span>
  </div>
)}

                {/* If no volunteer assigned yet */}
                {!schedule.assignedVolunteer && schedule.status === 'confirmed' && (
                  <div className="mt-4 pt-4 border-t bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Volunteer assignment pending. You'll be notified once a volunteer is assigned.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorSchedules;