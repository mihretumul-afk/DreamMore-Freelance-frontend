import api from './api';

export const freelancerService = {
  // Get current authenticated freelancer's profile
  getProfile: async () => {
    const response = await api.get('/freelancer/profile');
    return response.data;
  },

  // Update current freelancer's profile
  updateProfile: async (data) => {
    const response = await api.put('/freelancer/profile', data);
    return response.data;
  },

  // Get public freelancer profile by user ID or profile ID
  getPublicProfile: async (id) => {
    const response = await api.get(`/freelancers/${id}`);
    return response.data;
  },
};

export default freelancerService;
