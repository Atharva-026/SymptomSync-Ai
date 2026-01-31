import api from './api';

const doctorService = {
  getAllDoctors: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.specialty) params.append('specialty', filters.specialty);
      if (filters.available !== undefined) params.append('available', filters.available);

      const response = await api.get(`/doctors?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch doctors';
    }
  },

  getDoctor: async (doctorId) => {
    try {
      const response = await api.get(`/doctors/${doctorId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch doctor';
    }
  }
};

export default doctorService;