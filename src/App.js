import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TamboProvider } from '@tambo-ai/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppointmentProvider } from './context/AppointmentContext';

import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ViewSharedRecord from './pages/ViewSharedRecord';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { tamboComponents, tamboTools, systemPrompt } from './config/tamboConfig';

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
      <Route path="/" element={!user ? <LandingPage /> : userType === 'patient' ? <Navigate to="/patient" replace /> : <Navigate to="/doctor" replace />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/records/view/:token" element={<ViewSharedRecord />} />
      <Route path="/patient" element={<ProtectedRoute requiredUserType="patient"><PatientDashboard /></ProtectedRoute>} />
      <Route path="/doctor" element={<ProtectedRoute requiredUserType="doctor"><DoctorDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [userToken, setUserToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => setUserToken(localStorage.getItem('token'));
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // MUST use Tambo key, not Anthropic directly
  const tamboKey = process.env.REACT_APP_TAMBO_API_KEY;

  if (!tamboKey || !tamboKey.startsWith('tambo_')) {
    console.error('❌ Invalid Tambo API key!');
    console.error('Run: npx @tambo-ai/cli init');
    console.error('Or get key from: https://tambo.ai/settings');
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
              systemPrompt={systemPrompt}
              model="claude-3-5-sonnet-20241022"
              streamResponse={true}
              maxTokens={2000}
            >
              <AppContent />
            </TamboProvider>
          ) : (
            <div className="vh-100 d-flex align-items-center justify-content-center bg-warning">
              <div className="alert alert-danger shadow-lg p-5 text-center" style={{maxWidth: '600px'}}>
                <h3 className="alert-heading mb-4">⚠️ Tambo Setup Required</h3>
                <p className="mb-4">You need a valid Tambo API key to use this feature.</p>
                <div className="bg-dark text-white p-3 rounded mb-4 text-start">
                  <code>
                    # Run in terminal:<br/>
                    npx @tambo-ai/cli init
                  </code>
                </div>
                <p className="text-muted small mb-4">Or get your key from: <a href="https://tambo.ai/settings" target="_blank" rel="noreferrer">tambo.ai/settings</a></p>
                <hr/>
                <p className="small text-muted mb-0">The app will load once you add REACT_APP_TAMBO_API_KEY to your .env file</p>
              </div>
            </div>
          )}
        </AppointmentProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;