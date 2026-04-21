import api from './api';

const providerService = {

  analyzeSymptoms: async (symptoms, age, gender, comorbidities) => {
    const response = await api.post('/assessments/analyze', {
      symptoms, age, gender, comorbidities
    });
    return response.data;
  },

  getProviders: async (city, bodySystem, budget) => {
    const response = await api.get('/providers', {
      params: { city, bodySystem, budget, limit: 5 }
    });
    return response.data;
  },

  getCostEstimate: async (procedure, city, age, comorbidities, hospitalTier) => {
    const response = await api.post('/providers/cost-estimate', {
      procedure, city, age, comorbidities, hospitalTier
    });
    return response.data;
  }

};

export default providerService;