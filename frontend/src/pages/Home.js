import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Package, TrendingUp } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mb-8">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-6">Welcome to KindNest</h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Connecting generosity with those in need. Together, we can make a difference in our community.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/login"
              className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg text-lg"
            >
              Donate Now
            </Link>
            <Link
              to="/volunteer-registration"
              className="bg-white text-gray-800 border-2 border-gray-300 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-md hover:shadow-lg text-lg"
            >
              Become a Volunteer
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Package className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-3">Easy Donations</h3>
            <p className="text-gray-600">
              Donate money or physical items to causes you care about
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Users className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-3">Volunteer Network</h3>
            <p className="text-gray-600">
              Join our community of volunteers making real impact
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <TrendingUp className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-3">Track Impact</h3>
            <p className="text-gray-600">
              See how your contributions make a difference
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;