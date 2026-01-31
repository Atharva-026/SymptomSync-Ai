import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppointmentProvider } from './context/AppointmentContext';

// Pages
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, requiredUserType }) => {
  const { user, userType } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (requiredUserType && userType !== requiredUserType) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppContent() {
  const { user, userType } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={!user ? <LandingPage /> : (
          userType === 'patient' ? <Navigate to="/patient" replace /> : <Navigate to="/doctor" replace />
        )} />
        
        <Route path="/login" element={!user ? <Login /> : (
          userType === 'patient' ? <Navigate to="/patient" replace /> : <Navigate to="/doctor" replace />
        )} />
        
        <Route path="/register" element={!user ? <Register /> : (
          userType === 'patient' ? <Navigate to="/patient" replace /> : <Navigate to="/doctor" replace />
        )} />

        {/* Protected Routes */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute requiredUserType="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor"
          element={
            <ProtectedRoute requiredUserType="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppointmentProvider>
        <AppContent />
      </AppointmentProvider>
    </AuthProvider>
  );
}

export default App;