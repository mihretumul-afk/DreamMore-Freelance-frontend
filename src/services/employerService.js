import api from './api';

export const employerService = {
  // Get current authenticated employer's profile
  getProfile: async () => {
    const response = await api.get('/employer/profile');
    return response.data;
  },

  // Update current employer's profile
  updateProfile: async (data) => {
    const response = await api.put('/employer/profile', data);
    return response.data;
  },

  // Get public employer profile by user ID or profile ID
  getPublicProfile: async (id) => {
    const response = await api.get(`/employers/${id}`);
    return response.data;
  },
};

export default employerService;
