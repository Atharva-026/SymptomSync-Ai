import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TamboProvider } from '@tambo-ai/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppointmentProvider } from './context/AppointmentContext';

// Existing Pages
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ViewSharedRecord from './pages/ViewSharedRecord';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// NEW: Family Access Pages
import FamilyAccessPage from './pages/FamilyAccessPage';
import ManagePatientPage from './pages/ManagePatientPage';

// NEW: About Page
import AboutPage from './pages/AboutPage';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './App.css';
import { tamboComponents, tamboTools, systemPrompt } from './config/tamboConfig';

/**
 * ProtectedRoute logic
 * Ensures the user is logged in and matches the role if specified
 */
const ProtectedRoute = ({ children, requiredUserType }) => {
  const { user, userType } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (requiredUserType && userType !== requiredUserType) return <Navigate to="/" replace />;
  return children;
};

/**
 * AppContent Component
 * Defines the routing structure for the application
 */
function AppContent() {
  const { user, userType } = useAuth();
  return (
    <Routes>
      {/* Public & Logic Routes */}
      <Route path="/" element={!user ? <LandingPage /> : userType === 'patient' ? <Navigate to="/patient" replace /> : <Navigate to="/doctor" replace />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/records/view/:token" element={<ViewSharedRecord />} />
      
      {/* NEW: About Route (Public) */}
      <Route path="/about" element={<AboutPage />} />
      
      {/* Patient Dashboards */}
      <Route path="/patient" element={<ProtectedRoute requiredUserType="patient"><PatientDashboard /></ProtectedRoute>} />
      
      {/* NEW: Family Access Routes */}
      <Route path="/family-access" element={
        <ProtectedRoute>
          <FamilyAccessPage />
        </ProtectedRoute>
      } />
      
      <Route path="/family/manage-patient/:patientId" element={
        <ProtectedRoute>
          <ManagePatientPage />
        </ProtectedRoute>
      } />

      {/* Doctor Dashboards */}
      <Route path="/doctor" element={<ProtectedRoute requiredUserType="doctor"><DoctorDashboard /></ProtectedRoute>} />
      
      {/* Catch All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Main App Entry
 */
function App() {
  const [userToken, setUserToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => setUserToken(localStorage.getItem('token'));
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const tamboKey = process.env.REACT_APP_TAMBO_API_KEY;

  if (!tamboKey || !tamboKey.startsWith('tambo_')) {
    console.error('❌ Invalid Tambo API key!');
  }

  return (
    <Router>
      <AuthProvider>
        <AppointmentProvider>
          {tamboKey && tamboKey.startsWith('tambo_') ? (
            <TamboProvider
              apiKey={tamboKey}
              components={tamboComponents}
              tools={tamboTools}
              streaming={true}
              systemPrompt={systemPrompt}
            >
              <AppContent />
            </TamboProvider>
          ) : (
            <div className="vh-100 d-flex align-items-center justify-content-center bg-warning">
              <div className="alert alert-danger shadow-lg p-5 text-center" style={{maxWidth: '600px'}}>
                <h3 className="alert-heading mb-4">⚠️ Tambo Setup Required</h3>
                <p className="mb-4">You need a valid Tambo API key to use this feature.</p>
                <div className="bg-dark text-white p-3 rounded mb-4 text-start">
                  <code>npx @tambo-ai/cli init</code>
                </div>
                <hr/>
                <p className="small text-muted mb-0">The app will load once the key is added to .env</p>
              </div>
            </div>
          )}
        </AppointmentProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;