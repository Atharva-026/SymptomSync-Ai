import api from './api';

const medicalRecordService = {
  // Upload medical record
  uploadRecord: async (formData) => {
    try {
      const response = await api.post('/medical-records', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to upload record';
    }
  },

  // Get all my records
  getMyRecords: async () => {
    try {
      const response = await api.get('/medical-records');
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch records';
    }
  },

  // Get single record
  getRecord: async (recordId) => {
    try {
      const response = await api.get(`/medical-records/${recordId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch record';
    }
  },

  // Get record by share token (QR scan)
  getRecordByToken: async (token) => {
    try {
      const response = await api.get(`/medical-records/share/${token}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch shared record';
    }
  },

  // Share record with doctor
  shareWithDoctor: async (recordId, doctorId, accessDays = 30) => {
    try {
      const response = await api.post(`/medical-records/${recordId}/share`, {
        doctorId,
        accessDays,
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to share record';
    }
  },

  // Request AI analysis
  analyzeRecord: async (recordId) => {
    try {
      const response = await api.post(`/medical-records/${recordId}/analyze`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to analyze record';
    }
  },

  // Delete record
  deleteRecord: async (recordId) => {
    try {
      const response = await api.delete(`/medical-records/${recordId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to delete record';
    }
  },

  // Get records shared with me (doctor)
  getSharedRecords: async () => {
    try {
      const response = await api.get('/medical-records/shared-with-me');
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch shared records';
    }
  },
};

export default medicalRecordService;