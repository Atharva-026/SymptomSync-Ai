import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppointmentProvider } from './context/AppointmentContext';
import AuthSelector from './components/shared/AuthSelector';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
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
        {/* Landing/Auth Page */}
        <Route 
          path="/" 
          element={
            user ? (
              userType === 'patient' ? (
                <Navigate to="/patient" replace />
              ) : (
                <Navigate to="/doctor" replace />
              )
            ) : (
              <AuthSelector />
            )
          } 
        />

        {/* Patient Dashboard */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute requiredUserType="patient">
              <PatientDashboard />
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

        {/* Catch all - redirect to home */}
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