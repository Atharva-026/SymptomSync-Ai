import React, { createContext, useState, useContext, useEffect } from 'react';
import appointmentService from '../services/appointmentService';
import { useAuth } from './AuthContext';

const AppointmentContext = createContext();

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within AppointmentProvider');
  }
  return context;
};

export const AppointmentProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch appointments when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAppointments();
    } else {
      setAppointments([]);
    }
  }, [isAuthenticated, user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointmentData) => {
    try {
      const newAppointment = await appointmentService.createAppointment(appointmentData);
      setAppointments(prev => [...prev, newAppointment]);
      return newAppointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  };

  const updateAppointment = async (id, updates) => {
    try {
      const updatedAppointment = await appointmentService.updateAppointment(id, updates);
      setAppointments(prev =>
        prev.map(apt => (apt._id === id ? updatedAppointment : apt))
      );
      return updatedAppointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };

  const startVideoCall = async (appointmentId, roomUrl) => {
    try {
      const updated = await updateAppointment(appointmentId, {
        status: 'in-progress',
        roomUrl,
      });
      return updated;
    } catch (error) {
      throw error;
    }
  };

  const endVideoCall = async (appointmentId) => {
    try {
      const updated = await updateAppointment(appointmentId, {
        status: 'completed'
      });
      return updated;
    } catch (error) {
      throw error;
    }
  };

  const getPatientAppointments = (patientId) => {
    return appointments.filter(apt => apt.patient?._id === patientId || apt.patient === patientId);
  };

  const getDoctorAppointments = (doctorId) => {
    return appointments.filter(apt => apt.doctor?._id === doctorId || apt.doctor === doctorId);
  };

  const value = {
    appointments,
    loading,
    createAppointment,
    updateAppointment,
    startVideoCall,
    endVideoCall,
    getPatientAppointments,
    getDoctorAppointments,
    fetchAppointments,
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};