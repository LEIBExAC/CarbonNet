import { create } from 'zustand';

// Temporary mock auth store for testing
export const useAuthStore = create((set) => ({
  user: {
    id: '12345',
    name: 'Mohit Soni',
    email: 'mohit@example.com',
    role: 'user',
    profile: 'https://via.placeholder.com/150', // or '/assets/images/dummyUser.jpeg'
  },
  isAuthenticated: true,

  // Dummy login/logout actions for testing
  login: (userData) => set({ user: userData, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
