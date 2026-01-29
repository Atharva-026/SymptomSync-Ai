import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'patient' or 'doctor'

  const loginAsPatient = (patientData) => {
    setUser(patientData);
    setUserType('patient');
  };

  const loginAsDoctor = (doctorData) => {
    setUser(doctorData);
    setUserType('doctor');
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        loginAsPatient,
        loginAsDoctor,
        logout,
        isPatient: userType === 'patient',
        isDoctor: userType === 'doctor',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};