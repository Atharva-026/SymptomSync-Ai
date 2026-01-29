import React, { createContext, useState, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppointmentContext = createContext();

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within AppointmentProvider');
  }
  return context;
};

export const AppointmentProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);

  const createAppointment = (appointmentData) => {
    const newAppointment = {
      id: uuidv4(),
      ...appointmentData,
      status: 'scheduled', // scheduled, in-progress, completed, cancelled
      createdAt: new Date().toISOString(),
      roomUrl: null, // Will be set when video call starts
    };
    
    setAppointments(prev => [...prev, newAppointment]);
    return newAppointment;
  };

  const updateAppointment = (id, updates) => {
    setAppointments(prev =>
      prev.map(apt => (apt.id === id ? { ...apt, ...updates } : apt))
    );
  };

  const startVideoCall = (appointmentId, roomUrl) => {
    updateAppointment(appointmentId, {
      status: 'in-progress',
      roomUrl,
      startTime: new Date().toISOString(),
    });
  };

  const endVideoCall = (appointmentId) => {
    updateAppointment(appointmentId, {
      status: 'completed',
      endTime: new Date().toISOString(),
    });
  };

  const getPatientAppointments = (patientId) => {
    return appointments.filter(apt => apt.patientId === patientId);
  };

  const getDoctorAppointments = (doctorId) => {
    return appointments.filter(apt => apt.doctorId === doctorId);
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        createAppointment,
        updateAppointment,
        startVideoCall,
        endVideoCall,
        getPatientAppointments,
        getDoctorAppointments,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};