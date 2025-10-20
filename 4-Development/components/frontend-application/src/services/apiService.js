import axios from 'axios';
import { Auth } from 'aws-amplify';

const API_BASE_URL = process.env.REACT_APP_API_ENDPOINT || 'https://api.example.com';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });

    this.client.interceptors.request.use(async (config) => {
      try {
        const session = await Auth.currentSession();
        const token = session.getIdToken().getJwtToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.warn('No valid session found');
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          Auth.signOut();
        }
        return Promise.reject(error);
      }
    );
  }

  // Dashboard
  async getDashboardStats() {
    return this.client.get('/dashboard/stats');
  }

  // Cost Calculation
  async calculateCost(requirements) {
    return this.client.post('/calculations/cost', requirements);
  }

  async compareConfigurations(configurations) {
    return this.client.post('/calculations/compare', { configurations });
  }

  // Excel Processing
  async uploadExcel(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.post('/excel/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  async validateExcel(uploadId) {
    return this.client.post('/excel/validate', { uploadId });
  }

  async processExcel(validationId) {
    return this.client.post('/excel/process', { validationId });
  }

  // Document Generation
  async generateDocument(data) {
    return this.client.post('/documents/generate', data);
  }

  async getDocuments() {
    return this.client.get('/documents');
  }

  async getDocumentStatus(documentId) {
    return this.client.get(`/documents/${documentId}/status`);
  }

  async downloadDocument(documentId) {
    return this.client.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    });
  }

  // User Management
  async getUserProfile() {
    return this.client.get('/users/me');
  }

  async updateUserProfile(updates) {
    return this.client.put('/users/me', updates);
  }

  async getUsers() {
    return this.client.get('/admin/users');
  }

  async updateUserRole(userId, role) {
    return this.client.post(`/admin/users/${userId}/role`, { role });
  }
}

export const apiService = new ApiService();