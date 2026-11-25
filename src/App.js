import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppointmentProvider } from './context/AppointmentContext';

// Pages
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ViewSharedRecord from './pages/ViewSharedRecord';
import FamilyAccessPage from './pages/FamilyAccessPage';
import ManagePatientPage from './pages/ManagePatientPage';
import AboutPage from './pages/AboutPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

/**
 * Ensures the user is logged in and, if specified, has the right role
 */
const ProtectedRoute = ({ children, requiredUserType }) => {
  const { user, userType } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (requiredUserType && userType !== requiredUserType) return <Navigate to="/" replace />;
  return children;
};

function AppContent() {
  const { user, userType } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          !user ? (
            <LandingPage />
          ) : userType === 'patient' ? (
            <Navigate to="/patient" replace />
          ) : (
            <Navigate to="/doctor" replace />
          )
        }
      />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/records/view/:token" element={<ViewSharedRecord />} />
      <Route path="/about" element={<AboutPage />} />

      {/* Patient */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute requiredUserType="patient">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      {/* Family access */}
      <Route
        path="/family-access"
        element={
          <ProtectedRoute>
            <FamilyAccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/family/manage-patient/:patientId"
        element={
          <ProtectedRoute>
            <ManagePatientPage />
          </ProtectedRoute>
        }
      />

      {/* Doctor */}
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
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppointmentProvider>
          <AppContent />
        </AppointmentProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;