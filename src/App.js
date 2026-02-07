import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TamboProvider } from '@tambo-ai/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppointmentProvider } from './context/AppointmentContext';

// Pages
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ViewSharedRecord from './pages/ViewSharedRecord';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Import Tambo config
import { tamboComponents, tamboTools, systemPrompt } from './config/tamboConfig';

// Protected Route Component
const ProtectedRoute = ({ children, requiredUserType, allowedRole }) => {
  const { user, userType } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (requiredUserType && userType !== requiredUserType) return <Navigate to="/" replace />;
  if (allowedRole && userType !== allowedRole) return <Navigate to="/" replace />;
  return children;
};

// App Content Component
function AppContent() {
  const { user, userType } = useAuth();

  return (
    <Routes>
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
        element={
          !user ? (
            <Login />
          ) : userType === 'patient' ? (
            <Navigate to="/patient" replace />
          ) : (
            <Navigate to="/doctor" replace />
          )
        } 
      />

      <Route 
        path="/register" 
        element={
          !user ? (
            <Register />
          ) : userType === 'patient' ? (
            <Navigate to="/patient" replace />
          ) : (
            <Navigate to="/doctor" replace />
          )
        } 
      />

      <Route path="/records/view/:token" element={<ViewSharedRecord />} />

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App Component
function App() {
  const [userToken, setUserToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Debug check: This will show in your browser console if the key is missing
    if (!process.env.REACT_APP_TAMBO_API_KEY) {
      console.warn("⚠️ Tambo API Key is missing! Check your .env file and restart the server.");
    }

    const handleStorageChange = () => {
      setUserToken(localStorage.getItem('token'));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AppointmentProvider>
          {/* Updated TamboProvider:
            1. Using a standard Anthropic model ID.
            2. Passing credentials explicitly.
          */}
          <TamboProvider
            apiKey={process.env.REACT_APP_TAMBO_API_KEY}
            model={process.env.REACT_APP_TAMBO_MODEL || "claude-3-5-sonnet-20240620"}
            components={tamboComponents}
            tools={tamboTools}
            systemPrompt={systemPrompt}
            userToken={userToken}
            streamResponse={true}
            maxTokens={2000}
            temperature={0.7}
          >
            <AppContent />
          </TamboProvider>
        </AppointmentProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;