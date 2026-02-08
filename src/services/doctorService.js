import api from './api';

const doctorService = {
  getAllDoctors: async (params) => {
    try {
      const response = await api.get('/doctors', { params });
      // Return the data array directly
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  },

  getDoctor: async (id) => {
    try {
      const response = await api.get(`/doctors/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching doctor:', error);
      throw error;
    }
  }
};

export default doctorService;