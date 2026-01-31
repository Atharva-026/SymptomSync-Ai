import api from './api';

const appointmentService = {
  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/appointments', appointmentData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to create appointment';
    }
  },

  getAppointments: async () => {
    try {
      const response = await api.get('/appointments');
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch appointments';
    }
  },

  getAppointment: async (appointmentId) => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch appointment';
    }
  },

  updateAppointment: async (appointmentId, updates) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}`, updates);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update appointment';
    }
  },

  cancelAppointment: async (appointmentId) => {
    try {
      const response = await api.delete(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to cancel appointment';
    }
  }
};

export default appointmentService;