import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AppointmentProvider } from './context/AppointmentContext';

// Existing Pages
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ViewSharedRecord from './pages/ViewSharedRecord';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Family Access Pages
import FamilyAccessPage from './pages/FamilyAccessPage';
import ManagePatientPage from './pages/ManagePatientPage';

// About Page
import AboutPage from './pages/AboutPage';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './App.css';

/**
 * ProtectedRoute
 * Ensures the user is logged in and matches the required role.
 */
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

/**
 * AppContent
 * Defines the application routing structure.
 */
function AppContent() {
  const { user, userType } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
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

      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/" replace />}
      />

      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/" replace />}
      />

      <Route
        path="/records/view/:token"
        element={<ViewSharedRecord />}
      />

      <Route path="/about" element={<AboutPage />} />

      {/* Patient Dashboard */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute requiredUserType="patient">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      {/* Family Access */}
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

      {/* Doctor Dashboard */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute requiredUserType="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Main App
 * Tambo AI provider and API key dependency removed.
 */
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