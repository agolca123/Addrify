import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { ReverseAutomation } from './pages/ReverseAutomation';
import { ReverseResults } from './pages/ReverseResults';
import { Subscription } from './pages/Subscription';
import { LandingPage } from './pages/LandingPage';
import { useAuthStore } from './store/authStore';
import { SMSMessages } from './pages/sms/SMSMessages';
import { SMSTemplates } from './pages/sms/SMSTemplates';
import { SMSWorkflows } from './pages/sms/SMSWorkflows';
import { SMSStatusWorker } from './workers/smsStatusWorker';
import { useEffect } from 'react';

function App() {
  const { user } = useAuthStore();

  useEffect(() => {
    // SMS Status Worker'ı başlat
    const worker = SMSStatusWorker.getInstance();
    
    return () => {
      worker.stopWorker(); // Component unmount olduğunda worker'ı durdur
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {user && <Navigation />}
        <div className={user ? 'container mx-auto px-4 py-8' : ''}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={!user ? <LandingPage /> : 
              user.role === 'admin' ? 
                <PrivateRoute allowedRole="admin">
                  <AdminDashboard />
                </PrivateRoute> : 
                <PrivateRoute allowedRole="user">
                  <ClientDashboard />
                </PrivateRoute>
            } />
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

            {/* Reverse Address routes */}
            <Route path="/reverse-address" element={
              <PrivateRoute>
                <ReverseAddress />
              </PrivateRoute>
            } />
            <Route path="/reverse-automation" element={
              <PrivateRoute>
                <ReverseAutomation />
              </PrivateRoute>
            } />
            <Route path="/reverse-results" element={
              <PrivateRoute>
                <ReverseResults />
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

            {/* SMS route'ları */}
            <Route path="/sms/messages" element={<SMSMessages />} />
            <Route path="/sms/templates" element={<SMSTemplates />} />
            <Route path="/sms/workflows" element={<SMSWorkflows />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;