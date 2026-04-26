import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Users, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const localizer = momentLocalizer(moment);

const VolunteerCalendar = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');

  useEffect(() => {
    loadVolunteers();
  }, []);

  const loadVolunteers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/volunteers`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const data = await response.json();
      
      const activeVolunteers = data.filter(v => v.status === 'active');
      setVolunteers(activeVolunteers);
      
      const calendarEvents = [];
      
      activeVolunteers.forEach(volunteer => {
        if (!volunteer.availability) {
          console.warn(`Volunteer ${volunteer.name} has no availability set`);
          return;
        }
        
        console.log(`Processing ${volunteer.name}: ${volunteer.availability}`);
        
        const timeMatch = volunteer.availability.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
        if (!timeMatch) {
          console.warn(`Invalid time format for ${volunteer.name}: ${volunteer.availability}`);
          return;
        }
        
        const startTime = timeMatch[1];
        const endTime = timeMatch[2];
        
        const daysString = volunteer.availability.split(/\d{2}:\d{2}/)[0].trim();
        
        const dayAbbreviations = {
          'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday',
          'thu': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday',
          'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
          'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
        };
        
        let targetDays = [];
        
        if (daysString.toLowerCase().includes('all days')) {
          targetDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        } else if (daysString.toLowerCase().includes('weekdays')) {
          targetDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        } else if (daysString.toLowerCase().includes('weekends')) {
          targetDays = ['Saturday', 'Sunday'];
        } else {
          const dayParts = daysString.split(',').map(d => d.trim().toLowerCase());
          targetDays = dayParts
            .map(dayAbbr => {
              const cleanAbbr = dayAbbr.replace(/[^a-z]/gi, '').toLowerCase();
              return dayAbbreviations[cleanAbbr];
            })
            .filter(Boolean);
        }
        
        if (targetDays.length === 0) {
          console.warn(`No valid days found for ${volunteer.name}`);
          return;
        }
        
        const today = new Date();
        let eventsAdded = 0;
        
        for (let i = 0; i < 60; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
          
          if (targetDays.includes(dayName)) {
            const [startHour, startMin] = startTime.split(':');
            const [endHour, endMin] = endTime.split(':');
            
            const eventStart = new Date(date);
            eventStart.setHours(parseInt(startHour), parseInt(startMin), 0);
            
            const eventEnd = new Date(date);
            eventEnd.setHours(parseInt(endHour), parseInt(endMin), 0);
            
            calendarEvents.push({
              id: `${volunteer._id}-${i}`,
              title: `${volunteer.name} - ${volunteer.role}`,
              start: eventStart,
              end: eventEnd,
              resource: volunteer
            });
            
            eventsAdded++;
          }
        }
        
        console.log(`Added ${eventsAdded} events for ${volunteer.name}`);
      });
      
      console.log(`Total: Generated ${calendarEvents.length} calendar events from ${activeVolunteers.length} volunteers`);
      setEvents(calendarEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error loading volunteers:', error);
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const eventStyleGetter = (event) => {
    const roleColors = {
      'Pickup Driver': '#3b82f6',
      'Delivery Coordinator': '#10b981',
      'Donation Sorter': '#8b5cf6',
      'Inventory Manager': '#f59e0b',
      'Warehouse Helper': '#ec4899',
      'Event Coordinator': '#14b8a6',
      'Food Distribution': '#ef4444',
      'Community Outreach': '#8b5cf6',
      'Administrative Support': '#6366f1',
      'default': '#6b7280'
    };
    
    const color = roleColors[event.resource.role] || roleColors.default;
    
    return {
      style: {
        backgroundColor: color,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading volunteer availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Volunteer Availability Calendar</h1>
            <p className="text-gray-600">View when volunteers are available for assignments</p>
          </div>
          <Link
            to="/admin/schedules"
            className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors font-semibold flex items-center space-x-2 shadow-md"
          >
            <CalendarIcon className="w-5 h-5" />
            <span>View Pickup Schedules</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Role Color Legend:</h3>
          <div className="flex flex-wrap gap-4">
            {[
              { color: '#3b82f6', label: 'Pickup Driver' },
              { color: '#10b981', label: 'Delivery Coordinator' },
              { color: '#8b5cf6', label: 'Donation Sorter' },
              { color: '#f59e0b', label: 'Inventory Manager' },
              { color: '#ec4899', label: 'Warehouse Helper' },
              { color: '#14b8a6', label: 'Event Coordinator' },
              { color: '#ef4444', label: 'Food Distribution' },
              { color: '#6366f1', label: 'Administrative Support' },
              { color: '#6b7280', label: 'Other' }
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6" style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day']}
            view={currentView}
            onView={setCurrentView}
            date={currentDate}
            onNavigate={setCurrentDate}
            style={{ height: '100%' }}
            popup
            toolbar={true}
          />
        </div>
      </div>

      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Volunteer Details</h2>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold text-gray-800">{selectedEvent.resource.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-semibold text-gray-800">{selectedEvent.resource.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold text-gray-800">{selectedEvent.resource.phone}</p>
              </div>
              {selectedEvent.resource.email && selectedEvent.resource.email !== 'N/A' && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-800">{selectedEvent.resource.email}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Full Availability</p>
                <p className="font-semibold text-gray-800">{selectedEvent.resource.availability}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">This Time Slot</p>
                <p className="font-semibold text-gray-800">
                  {selectedEvent.start.toLocaleDateString()} <br />
                  {selectedEvent.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {selectedEvent.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <Link
                to="/admin/schedules"
                className="block w-full text-center bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors font-semibold"
              >
                Assign to Pickup Schedule →
              </Link>
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerCalendar;