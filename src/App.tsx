import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PrivateRoute } from './components/PrivateRoute';
import { Settings } from './pages/Settings';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { ClientLocations } from './pages/client/ClientLocations';
import { ClientAnalytics } from './pages/client/ClientAnalytics';
import { ReverseAddress } from './pages/ReverseAddress';
import { Subscription } from './pages/Subscription';
import { LandingPage } from './pages/LandingPage';
import { useAuthStore } from './store/authStore';

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Navigation />}
        <div className={user ? 'container mx-auto px-4 py-8' : ''}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={!user ? <LandingPage /> : 
              user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/client" />} 
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin routes */}
            <Route path="/admin" element={
              <PrivateRoute allowedRole="admin">
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/admin/users" element={
              <PrivateRoute allowedRole="admin">
                <AdminUsers />
              </PrivateRoute>
            } />
            <Route path="/admin/payments" element={
              <PrivateRoute allowedRole="admin">
                <AdminPayments />
              </PrivateRoute>
            } />
            <Route path="/admin/analytics" element={
              <PrivateRoute allowedRole="admin">
                <AdminAnalytics />
              </PrivateRoute>
            } />

            {/* Client routes */}
            <Route path="/client" element={
              <PrivateRoute allowedRole="user">
                <ClientDashboard />
              </PrivateRoute>
            } />
            <Route path="/client/locations" element={
              <PrivateRoute allowedRole="user">
                <ClientLocations />
              </PrivateRoute>
            } />
            <Route path="/client/analytics" element={
              <PrivateRoute allowedRole="user">
                <ClientAnalytics />
              </PrivateRoute>
            } />
            <Route path="/reverse-address" element={
              <PrivateRoute>
                <ReverseAddress />
              </PrivateRoute>
            } />

            {/* Common routes */}
            <Route path="/settings" element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            } />
            <Route path="/subscription" element={
              <PrivateRoute>
                <Subscription />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;