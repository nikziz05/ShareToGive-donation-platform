import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import BrowseNeeds from './pages/BrowseNeeds';
import MyDonations from './pages/MyDonations';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DonorSchedules from './pages/DonorSchedules';
import AdminNeeds from './pages/admin/AdminNeeds';
import AdminSchedules from './pages/admin/AdminSchedules';
import AdminDonations from './pages/admin/AdminDonations';
import AdminInventory from './pages/admin/AdminInventory';
import AdminVolunteers from './pages/admin/AdminVolunteers';
import VolunteerCalendar from './pages/admin/VolunteerCalendar';
import VolunteerDashboard from './pages/VolunteerDashboard';
import VolunteerRegistration from './pages/VolunteerRegistration';
import Home from './pages/Home';
import Landing from './pages/Landing';

function AppRoutes() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      {user && <Navbar />}
      <Routes>
       {/* Landing page - accessible without login */}
         <Route path="/" element={user ? (
          user.role === 'donor' ? <BrowseNeeds /> : 
          user.role === 'volunteer' ? <Navigate to="/volunteer/dashboard" /> :
          user.role === 'admin' ? <Navigate to="/admin/needs" /> :
        <Navigate to="/login" />
        ) : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/volunteer-registration" element={<VolunteerRegistration />} />
        <Route 
          path="/volunteer/dashboard" 
          element={user?.role === 'volunteer' ? <VolunteerDashboard /> : <Navigate to="/login" />} 
        />
        <Route path="/" element={
          user ? (
             user.role === 'donor' ? <BrowseNeeds /> : 
             user.role === 'volunteer' ? <Navigate to="/volunteer/dashboard" /> :
             user.role === 'admin' ? <Navigate to="/admin/needs" /> :
             <Navigate to="/login" />
          ) : <Navigate to="/login" />
        } />
        <Route path="/my-donations" element={user?.role === 'donor' ? <MyDonations /> : <Navigate to="/login" />} />
        <Route path="/my-schedules" element={user?.role === 'donor' ? <DonorSchedules /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/admin/needs" element={user?.role === 'admin' ? <AdminNeeds /> : <Navigate to="/login" />} />
        <Route path="/admin/schedules" element={user?.role === 'admin' ? <AdminSchedules /> : <Navigate to="/login" />} />
        <Route path="/admin/donations" element={user?.role === 'admin' ? <AdminDonations /> : <Navigate to="/login" />} />
        <Route path="/admin/inventory" element={user?.role === 'admin' ? <AdminInventory /> : <Navigate to="/login" />} />
        <Route path="/admin/volunteers" element={user?.role === 'admin' ? <AdminVolunteers /> : <Navigate to="/login" />} />
        <Route path="/admin/volunteer-calendar" element={user?.role === 'admin' ? <VolunteerCalendar /> : <Navigate to="/login" />} />
        <Route path="/volunteer/dashboard" element={user ? <VolunteerDashboard /> : <Navigate to="/login" />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;