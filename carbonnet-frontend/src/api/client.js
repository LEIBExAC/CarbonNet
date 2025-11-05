import { API_BASE_URL } from "../config/api";

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token && !options.skipAuth) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth
  auth = {
    login: (credentials) =>
      this.request("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    register: (userData) =>
      this.request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    logout: () => this.request("/auth/logout", { method: "POST" }),
    getMe: () => this.request("/auth/me"),
    forgotPassword: (email) =>
      this.request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token, password) =>
      this.request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }),
    verifyEmail: (token) =>
      this.request(`/auth/verify-email/${token}`, {
        method: "GET",
      }),
    resendVerification: (email) =>
      this.request("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  };

  // Activities
  activities = {
    estimate: (data) =>
      this.request("/activities/estimate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    create: (data) =>
      this.request("/activities", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getAll: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/activities?${query}`);
    },
    getById: (id) => this.request(`/activities/${id}`),
    update: (id, data) =>
      this.request(`/activities/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id) => this.request(`/activities/${id}`, { method: "DELETE" }),
    getRecommendations: () => this.request("/activities/recommendations"),
    getTrends: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/activities/trends?${query}`);
    },
  };

  // Users
  users = {
    getProfile: () => this.request("/users/profile"),
    updateProfile: (data) =>
      this.request("/users/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    changePassword: (data) =>
      this.request("/users/change-password", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteAccount: () => this.request("/users/profile", { method: "DELETE" }),
    getDashboard: () => this.request("/users/dashboard"),
    getStatistics: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/users/statistics?${query}`);
    },
    getLeaderboard: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/users/leaderboard?${query}`);
    },
  };

  // Challenges
  challenges = {
    getAll: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/challenges?${query}`);
    },
    getActive: () => this.request("/challenges/active"),
    getMyChallenges: () => this.request("/challenges/my-challenges"),
    getById: (id) => this.request(`/challenges/${id}`),
    create: (data) =>
      this.request("/challenges", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      this.request(`/challenges/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id) => this.request(`/challenges/${id}`, { method: "DELETE" }),
    join: (id) => this.request(`/challenges/${id}/join`, { method: "POST" }),
    updateProgress: (id, data) =>
      this.request(`/challenges/${id}/progress`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    getLeaderboard: (id) => this.request(`/challenges/${id}/leaderboard`),
  };

  // Reports
  reports = {
    generate: (data) =>
      this.request("/reports/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getAll: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/reports?${query}`);
    },
    getById: (id) => this.request(`/reports/${id}`),
    download: (id) => this.request(`/reports/${id}/download`),
    delete: (id) => this.request(`/reports/${id}`, { method: "DELETE" }),
  };

  // Upload
  upload = {
    bulkActivities: (formData) =>
      this.request("/upload/bulk-activities", {
        method: "POST",
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      }),
  };

  // Emissions
  emissions = {
    getFactors: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/emissions/factors?${query}`);
    },
    createFactor: (data) =>
      this.request("/emissions/factors", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateFactor: (id, data) =>
      this.request(`/emissions/factors/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteFactor: (id) =>
      this.request(`/emissions/factors/${id}`, { method: "DELETE" }),
  };

  // Admin
  admin = {
    getDashboard: () => this.request("/admin/dashboard"),
    getUsers: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/users?${query}`);
    },
    updateUser: (id, data) =>
      this.request(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteUser: (id) => this.request(`/users/${id}`, { method: "DELETE" }),
    getInstitutions: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/institutions?${query}`);
    },
    createInstitution: (data) =>
      this.request("/institutions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateInstitution: (id, data) =>
      this.request(`/institutions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteInstitution: (id) =>
      this.request(`/institutions/${id}`, { method: "DELETE" }),
    getAnalytics: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/admin/analytics?${query}`);
    },
    approveAISuggestion: (data) =>
      this.request("/admin/ai-suggestions/approve", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };

  // Institutions
  institutions = {
    getAll: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/institutions?${query}`);
    },
    getById: (id) => this.request(`/institutions/${id}`),
    getLeaderboard: (id) => this.request(`/institutions/${id}/leaderboard`),
    getTopContributors: (id) =>
      this.request(`/institutions/${id}/top-contributors`),
  };
}

const api = new ApiClient();

export default api;
export { ApiClient };
