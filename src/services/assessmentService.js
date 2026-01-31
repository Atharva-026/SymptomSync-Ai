import api from './api';

const assessmentService = {
  createAssessment: async (assessmentData) => {
    try {
      const response = await api.post('/assessments', assessmentData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to create assessment';
    }
  },

  getAssessments: async () => {
    try {
      const response = await api.get('/assessments');
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch assessments';
    }
  },

  getAssessment: async (assessmentId) => {
    try {
      const response = await api.get(`/assessments/${assessmentId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch assessment';
    }
  }
};

export default assessmentService;