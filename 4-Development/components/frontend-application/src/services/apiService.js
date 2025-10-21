import axios from 'axios';
import { Auth } from 'aws-amplify';

// Staging environment configuration
const API_BASE_URL = process.env.REACT_APP_API_ENDPOINT || 'https://9u3ohhh561.execute-api.us-east-1.amazonaws.com/staging';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true' || false; // Disable mock data to test real APIs

// Working endpoints that can use real API calls (per technical design)
const WORKING_ENDPOINTS = [
  '/admin/metrics',  // ✅ Implemented in user-management-service
  '/estimations'     // ✅ Implemented in user-management-service
];

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
      (error) => this.handleApiError(error)
    );
  }

  handleApiError(error) {
    if (error.response?.status === 401) {
      Auth.signOut();
      window.location.href = '/';
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Please check your permissions.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }

  async withApiCall(apiCall, endpoint = '') {
    try {
      const result = await apiCall();
      console.log(`✅ API success for ${endpoint}:`, result);
      return result;
    } catch (error) {
      console.error(`❌ API failed for ${endpoint}:`, error.message);
      throw new Error(`API endpoint ${endpoint} is currently unavailable. Please contact support.`);
    }
  }

  // Dashboard Metrics API Integration (per technical design section 9.1)
  async getDashboardMetrics(params = {}) {
    return this.withApiCall(() => this.client.get('/dashboard/metrics', { params }), '/dashboard/metrics');
  }

  // Admin Metrics API Integration (per technical design section 9.4)
  async getAdminMetrics(params = {}) {
    return this.withApiCall(() => this.client.get('/admin/metrics', { params }), '/admin/metrics');
  }

  // Cost Calculation API Integration
  async calculateCost(requirements) {
    return this.withApiCall(() => this.client.post('/calculations/cost', requirements), '/calculations/cost');
  }

  async compareConfigurations(configurations) {
    return this.withApiCall(() => this.client.post('/calculations/compare', { configurations }), '/calculations/compare');
  }

  // Excel Processing API Integration
  async downloadExcelTemplate() {
    try {
      const response = await this.client.get('/excel/template');
      if (response.success && response.data.downloadUrl) {
        // Use presigned URL for direct download
        window.open(response.data.downloadUrl, '_blank');
        return response;
      }
    } catch (error) {
      console.error('Template download failed:', error);
      // Fallback to direct blob download
      return this.withApiCall(() => this.client.get('/excel/template', { responseType: 'blob' }), '/excel/template');
    }
  }

  async uploadExcel(file) {
    const reader = new FileReader();
    const fileContent = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result.split(',')[1]); // Get base64 content
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    const uploadData = {
      fileName: file.name,
      fileContent: fileContent,
      templateType: 'cost-estimation'
    };
    
    return await this.withApiCall(() => this.client.post('/excel/upload', uploadData), '/excel/upload');
  }

  async validateExcel(uploadId) {
    return await this.withApiCall(() => this.client.post('/excel/validate', { uploadId, templateType: 'cost-estimation' }), '/excel/validate');
  }

  async processExcel(validationId, estimationId) {
    return await this.withApiCall(() => this.client.post('/excel/process', { validationId, estimationId }), '/excel/process');
  }

  // Document Generation API Integration
  async generateDocument(data) {
    return await this.withApiCall(() => this.client.post('/documents/generate', data), '/documents/generate');
  }

  async getDocuments() {
    return await this.withApiCall(() => this.client.get('/documents'), '/documents');
  }

  async getDocumentStatus(documentId) {
    return await this.withApiCall(() => this.client.get(`/documents/${documentId}/status`), `/documents/${documentId}/status`);
  }

  async downloadDocument(documentId) {
    return await this.withApiCall(() => this.client.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    }), `/documents/${documentId}/download`);
  }

  // User Management API Integration
  async getUserProfile() {
    return await this.withApiCall(() => this.client.get('/users/me'), '/users/me');
  }

  async updateUserProfile(updates) {
    return await this.withApiCall(() => this.client.put('/users/me', updates), '/users/me');
  }

  async getUsers() {
    return await this.withApiCall(() => this.client.get('/admin/users'), '/admin/users');
  }

  async updateUserRole(userId, role) {
    return await this.withApiCall(() => this.client.post(`/admin/users/${userId}/role`, { role }), `/admin/users/${userId}/role`);
  }

  // Estimations Management API Integration
  async getEstimations(params = {}) {
    return this.withApiCall(() => this.client.get('/estimations', { params }), '/estimations');
  }

  async getEstimation(estimationId) {
    return await this.withApiCall(() => this.client.get(`/estimations/${estimationId}`), `/estimations/${estimationId}`);
  }

  async createEstimation(data) {
    return this.withApiCall(() => this.client.post('/estimations', data), '/estimations');
  }

  async updateEstimation(estimationId, updates) {
    return this.withApiCall(() => this.client.put(`/estimations/${estimationId}`, updates), `/estimations/${estimationId}`);
  }

  async deleteEstimation(estimationId) {
    return await this.withApiCall(() => this.client.delete(`/estimations/${estimationId}`), `/estimations/${estimationId}`);
  }

  async cloneEstimation(estimationId, updates) {
    return await this.withApiCall(() => this.client.post(`/estimations/${estimationId}/clone`, updates), `/estimations/${estimationId}/clone`);
  }

  // Save estimation (alias for createEstimation)
  async saveEstimation(data) {
    return this.createEstimation(data);
  }
}

export const apiService = new ApiService();