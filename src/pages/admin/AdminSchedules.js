import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Clock, MapPin, User, Phone, Check, X, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const localizer = momentLocalizer(moment);

const AdminSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [filteredVolunteers, setFilteredVolunteers] = useState([]);

  useEffect(() => {
    loadSchedules();
    loadVolunteers();
    const interval = setInterval(() => {
    loadSchedules();
  }, 30000);
  return () => clearInterval(interval);
  }, []);

const loadSchedules = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/schedules', {
      headers: { 'x-auth-token': localStorage.getItem('token') }
    });
    const data = await response.json();
    
    console.log('=== SCHEDULE DEBUG ===');
    console.log('Total:', data.length);
    console.log('Pending:', data.filter(s => s.status === 'pending').length);
    console.log('Confirmed:', data.filter(s => s.status === 'confirmed').length);
    console.log('Completed:', data.filter(s => s.status === 'completed').length);
    
    setSchedules(data);
    
    // Create calendar events
    const calendarEvents = data.map(schedule => ({
      id: schedule._id,
      title: `${schedule.type === 'pickup' ? 'Pickup' : 'Drop-off'} - ${schedule.donorId?.name || 'Donor'}`,
      start: new Date(`${schedule.date.split('T')[0]}T${schedule.time}`),
      end: new Date(new Date(`${schedule.date.split('T')[0]}T${schedule.time}`).getTime() + 3600000),
      resource: schedule
    }));
    
    setEvents(calendarEvents);
    setLoading(false);
  } catch (error) {
    console.error('Error loading schedules:', error);
    setLoading(false);
  }
};
  const loadVolunteers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/volunteers', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const data = await response.json();
      setVolunteers(data.filter(v => v.status === 'active'));
    } catch (error) {
      console.error('Error loading volunteers:', error);
    }
  };

  // Same logic as AdminDonations-suggested volunteers ONLY
const getSuggestedVolunteers = (scheduleDate, scheduleTime) => {
  console.log('\n=== FILTER VOLUNTEERS START ===');
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
      console.log('  All days');
    } else if (daysString.toLowerCase().includes('weekdays')) {
      availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      console.log('  Weekdays');
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
    
    console.log(`  ${v.name} IS AVAILABLE`);
    return true;
  });
  
  console.log(`\nTotal available: ${suggested.length}`);
  console.log('=== FILTER VOLUNTEERS END ===\n');
  
  // Sort by role (Pickup Drivers first)
  return suggested.sort((a, b) => {
    if (a.role === 'Pickup Driver' && b.role !== 'Pickup Driver') return -1;
    if (a.role !== 'Pickup Driver' && b.role === 'Pickup Driver') return 1;
    return 0;
  });
};

  const handleSelectEvent = (event) => {
    const schedule = event.resource;
    console.log('Schedule Info:');
    console.log('   Date:', schedule.date);
    console.log('   Time:', schedule.time);
    console.log('   Type:', schedule.type);
    console.log('   Status:', schedule.status);
    setSelectedEvent(schedule);
    setSelectedVolunteer(schedule.assignedVolunteer?._id || '');
    // Filter volunteers based on schedule date/time
  if (schedule.date && schedule.time) {
    const dateOnly = schedule.date.split('T')[0];
    console.log('\nFiltering volunteers');
    console.log('   Total volunteers:', volunteers.length);
    
    const available = getSuggestedVolunteers(dateOnly, schedule.time);
    
    console.log('   Available:', available.length);
    if (available.length > 0) {
      available.forEach(v => console.log(`${v.name} (${v.role})`));
    }
    
    setFilteredVolunteers(available);
  } else {
    console.warn('No date/time on schedule, showing all volunteers');
    setFilteredVolunteers(volunteers);
  }
  
  setShowModal(true);
  console.log('\nModal opened with', filteredVolunteers.length, 'filtered volunteers\n');
  };

  const updateScheduleStatus = async (scheduleId, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ status: newStatus })
      });
      alert(`Schedule ${newStatus} successfully!`);
      setShowModal(false);
      loadSchedules();
    } catch (error) {
      alert('Error updating schedule');
    }
  };

  const assignVolunteer = async () => {
    if (!selectedVolunteer) {
      alert('Please select a volunteer');
      return;
    }
    
    try {
      await fetch(`http://localhost:5000/api/schedules/${selectedEvent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ assignedVolunteer: selectedVolunteer })
      });
      alert('Volunteer assigned successfully!');
      setShowModal(false);
      loadSchedules();
    } catch (error) {
      alert('Error assigning volunteer');
    }
  };

  const eventStyleGetter = (event) => {
    const status = event.resource.status;
    let backgroundColor, textColor;
    
    switch(status) {
      case 'completed':
        backgroundColor = '#10b981';
        textColor = '#ffffff';
        break;
      case 'confirmed':
        backgroundColor = '#3b82f6';
        textColor = '#ffffff';
        break;
      case 'cancelled':
        backgroundColor = '#ef4444';
        textColor = '#ffffff';
        break;
      default:
        backgroundColor = '#f59e0b';
        textColor = '#ffffff';
    }
    
    return {
      style: {
        backgroundColor,
        color: textColor,
        borderRadius: '6px',
        border: 'none',
        padding: '4px 8px',
        fontSize: '12px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'visible'
      },
      className: 'custom-event'
    };
  };

  const CustomEvent = ({ event }) => {
    const status = event.resource.status;
    let statusBadge, badgeColor;
    
    switch(status) {
      case 'completed':
        statusBadge = 'Completed';
        badgeColor = 'bg-green-600';
        break;
      case 'confirmed':
        statusBadge = 'Confirmed';
        badgeColor = 'bg-blue-600';
        break;
      case 'cancelled':
        statusBadge = 'Cancelled';
        badgeColor = 'bg-red-600';
        break;
      default:
        statusBadge = 'Pending';
        badgeColor = 'bg-yellow-600';
    }

    return (
      <div className="event-content">
        <div className="font-medium text-xs">{event.title}</div>
        <div className={`text-[10px] mt-1 px-2 py-0.5 rounded-full inline-block ${badgeColor} text-white`}>
          {statusBadge}
        </div>
      </div>
    );
  };

  const handleNavigate = useCallback((newDate) => {
    setCurrentDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView) => {
    setCurrentView(newView);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 animate-pulse">📅</div>
          <p className="text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        .custom-event:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          z-index: 10;
        }
        .rbc-event {
          transition: all 0.2s ease !important;
        }
        .event-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .rbc-day-bg:hover {
          background-color: #f3f4f6;
        }
        .rbc-date-cell:hover {
          background-color: #e5e7eb;
          border-radius: 4px;
        }
        .rbc-event-content {
          overflow: visible !important;
        }
        .rbc-event[style*="background-color: rgb(245, 158, 11)"]:hover {
          background-color: #d97706 !important;
        }
        .rbc-event[style*="background-color: rgb(59, 130, 246)"]:hover {
          background-color: #2563eb !important;
        }
        .rbc-event[style*="background-color: rgb(16, 185, 129)"]:hover {
          background-color: #059669 !important;
        }
        .rbc-event[style*="background-color: rgb(239, 68, 68)"]:hover {
          background-color: #dc2626 !important;
        }
        .rbc-event:hover {
          position: relative;
          z-index: 100;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pickup & Drop-off Schedule</h1>
          <p className="text-gray-600">Manage donation logistics - Hover over events to see details</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-500 mb-1">Total Schedules</p>
            <p className="text-2xl font-bold text-gray-800">{schedules.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-md p-4">
            <p className="text-sm text-yellow-700 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-800">
              {schedules.filter(s => s.status === 'pending').length}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-md p-4">
            <p className="text-sm text-blue-700 mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-blue-800">
              {schedules.filter(s => s.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-md p-4">
            <p className="text-sm text-green-700 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-800">
              {schedules.filter(s => s.status === 'completed').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6" style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent
            }}
            views={['month', 'week', 'day']}
            view={currentView}
            onView={handleViewChange}
            date={currentDate}
            onNavigate={handleNavigate}
            popup
            style={{ height: '100%' }}
          />
        </div>

        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Pickup Calendar</h2>
          <Link
            to="/admin/volunteer-calendar"
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Check Volunteer Availability</span>
          </Link>
        </div>
      </div>

      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Schedule Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  selectedEvent.type === 'pickup' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedEvent.type === 'pickup' ? 'Pickup' : 'Drop-off'}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  selectedEvent.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedEvent.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  selectedEvent.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedEvent.status.toUpperCase()}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3 text-gray-700">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Donor</p>
                    <p className="font-medium">{selectedEvent.donorId?.name || 'Unknown'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-gray-700">
                  <div className="w-5 h-5">📅</div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{moment(selectedEvent.date).format('MMMM DD, YYYY')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-gray-700">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{selectedEvent.time}</p>
                  </div>
                </div>

                {selectedEvent.address && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{selectedEvent.address}</p>
                    </div>
                  </div>
                )}

                {selectedEvent.phone && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Contact</p>
                      <p className="font-medium">{selectedEvent.phone}</p>
                    </div>
                  </div>
                )}

                {selectedEvent.notes && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-gray-700 italic">{selectedEvent.notes}</p>
                  </div>
                )}
              </div>

              {(selectedEvent.status === 'confirmed' || selectedEvent.status === 'pending') && (
  <div className="bg-blue-50 rounded-lg p-4">
    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
      <Users className="w-5 h-5 mr-2" />
      Volunteer Assignment
    </h3>
    
    {selectedEvent.assignedVolunteer ? (
      // Already assigned - show volunteer info
      <div className="bg-white rounded p-3 space-y-2">
        <p className="text-sm text-gray-500">Assigned to:</p>
        <p className="font-medium text-lg">{selectedEvent.assignedVolunteer.name}</p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Role:</span> {selectedEvent.assignedVolunteer.role}
        </p>
        <p className="text-sm text-gray-600">
          <Phone className="w-4 h-4 inline mr-1" />
          {selectedEvent.assignedVolunteer.phone}
        </p>
      </div>
    ) : (
      // Not assigned - show filtered dropdown
      <div className="space-y-3">
        {/* Show available count */}
        <p className={`text-sm font-medium ${
          filteredVolunteers.length > 0 ? 'text-green-700' : 'text-red-700'
        }`}>
          {filteredVolunteers.length > 0 
            ? `${filteredVolunteers.length} volunteer${filteredVolunteers.length > 1 ? 's' : ''} available for this time slot`
            : 'No volunteers available for this time slot'
          }
        </p>
        
        {/* CRITICAL: Only show filteredVolunteers in dropdown */}
        {filteredVolunteers.length > 0 ? (
          <>
            <select
              value={selectedVolunteer}
              onChange={(e) => setSelectedVolunteer(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Volunteer</option>
              {filteredVolunteers.map(v => (
                <option key={v._id} value={v._id}>
                  {v.name} - {v.role} ({v.phone})
                </option>
              ))}
            </select>
            
            <button
              onClick={assignVolunteer}
              disabled={!selectedVolunteer}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Assign Selected Volunteer
            </button>
          </>
        ) : (
          // Show why no volunteers are available
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium mb-2">
              No volunteers match this schedule
            </p>
            <p className="text-xs text-red-600 mb-3">
              Checked {volunteers.length} volunteers - none are available on{' '}
              {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long' })}{' '}
              at {selectedEvent.time}
            </p>
            
            {/* Show all volunteers for reference */}
            <details className="text-xs">
              <summary className="text-red-700 cursor-pointer font-medium mb-2">
                View all volunteers (not available)
              </summary>
              <div className="mt-2 space-y-1 text-gray-600 max-h-40 overflow-y-auto">
                {volunteers.map(v => (
                  <p key={v._id} className="border-b border-gray-200 pb-1">
                    • {v.name} ({v.role})
                    <br />
                    <span className="text-xs text-gray-500 ml-3">
                      {v.availability || 'No availability set'}
                    </span>
                  </p>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    )}
  </div>
)}

              <div className="flex space-x-3 pt-4">
                {selectedEvent.status === 'pending' && (
                  <button
                    onClick={() => updateScheduleStatus(selectedEvent._id, 'confirmed')}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center space-x-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>Confirm Schedule</span>
                  </button>
                )}

                {selectedEvent.status === 'confirmed' && (
                  <button
                    onClick={() => updateScheduleStatus(selectedEvent._id, 'completed')}
                    className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center justify-center space-x-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>Mark as Completed</span>
                  </button>
                )}

                {(selectedEvent.status === 'pending' || selectedEvent.status === 'confirmed') && (
                  <button
                    onClick={() => updateScheduleStatus(selectedEvent._id, 'cancelled')}
                    className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold flex items-center justify-center space-x-2"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                )}

                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchedules;