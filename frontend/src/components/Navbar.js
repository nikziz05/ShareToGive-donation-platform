import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Heart, Home, Package, Users, Calendar, BarChart, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">KindNest</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {user?.role === 'donor' ? (
              <>
                <Link to="/" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
                  <Home className="w-5 h-5" />
                  <span>Browse</span>
                </Link>
                <Link to="/my-donations" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
                  <Package className="w-5 h-5" />
                  <span>My Donations</span>
                </Link>
                <Link to="/my-schedules" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                  <Calendar className="w-5 h-5" />
                  <span>My Schedules</span>
                </Link>
              </>
            ) : user?.role === 'volunteer' ? (
               <>
              <Link to="/volunteer/dashboard" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
                <Calendar className="w-5 h-5" />
                <span>My Assignments</span>
              </Link>
              </>
            )  : (
              <>
                <Link to="/admin/needs" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span>Needs</span>
                </Link>
                <Link to="/admin/donations" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
                  <BarChart className="w-5 h-5" />
                  <span>Donations</span>
                </Link>
                <Link to="/admin/inventory" className="flex items-center space-x-1 text-gray-600 hover:text-green-600">
                  <Package className="w-5 h-5" />
                  <span>Inventory</span>
                </Link>
                <Link to="/admin/schedules" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
                  <Calendar className="w-5 h-5" />
                  <span>Schedules</span>
                </Link>
                <Link to="/admin/volunteers" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
                  <Users className="w-5 h-5" />
                  <span>Volunteers</span>
                </Link>
                <Link to="/admin/volunteer-calendar" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
                  <Calendar className="w-5 h-5" />
                  <span>Availability</span>
                </Link>
              </>
            )}

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4 pl-4 border-l">
              <span className="text-sm text-gray-600">
                {user?.name} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;