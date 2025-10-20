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
      window.location.href = '/login';
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
    const mockTemplate = new Blob(['Mock Excel Template'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return this.withMockFallback(() => this.client.get('/excel/template', { responseType: 'blob' }), mockTemplate);
  }

  async uploadExcel(file) {
    const formData = new FormData();
    formData.append('file', file);
    const mockUpload = { uploadId: 'upload_' + Date.now(), filename: file.name, size: file.size };
    return this.withMockFallback(() => this.client.post('/excel/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }), mockUpload);
  }

  async validateExcel(uploadId) {
    const mockValidation = {
      validationId: 'val_' + Date.now(),
      status: 'valid',
      results: {
        clientInfo: { status: 'valid', message: 'Valid client information' },
        computeRequirements: { status: 'valid', message: 'Valid (3 servers)' },
        storageRequirements: { status: 'valid', message: 'Valid (500GB total)' },
        networkRequirements: { status: 'warning', message: 'Consider CDN for global users' }
      }
    };
    return this.withMockFallback(() => this.client.post('/excel/validate', { uploadId }), mockValidation);
  }

  async processExcel(validationId, estimationId) {
    const mockProcess = { estimationId: estimationId || 'est_' + Date.now(), status: 'processed' };
    return this.withMockFallback(() => this.client.post('/excel/process', { validationId, estimationId }), mockProcess);
  }

  // Document Generation API Integration
  async generateDocument(data) {
    const mockGeneration = { documentId: 'doc_' + Date.now(), status: 'PROCESSING' };
    return this.withMockFallback(() => this.client.post('/documents/generate', data), mockGeneration);
  }

  async getDocuments() {
    const mockDocuments = {
      documents: [
        { documentId: 'doc123', type: 'PROPOSAL', estimationId: 'est123', createdAt: '2024-01-15', status: 'COMPLETED' },
        { documentId: 'doc124', type: 'TECHNICAL_SPEC', estimationId: 'est124', createdAt: '2024-01-14', status: 'COMPLETED' }
      ]
    };
    return this.withMockFallback(() => this.client.get('/documents'), mockDocuments);
  }

  async getDocumentStatus(documentId) {
    const mockStatus = {
      documentId,
      status: 'COMPLETED',
      downloadUrl: `https://example.com/documents/${documentId}.pdf`,
      createdAt: new Date().toISOString()
    };
    return this.withMockFallback(() => this.client.get(`/documents/${documentId}/status`), mockStatus);
  }

  async downloadDocument(documentId) {
    const mockDocument = new Blob(['Mock PDF Document'], { type: 'application/pdf' });
    return this.withMockFallback(() => this.client.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    }), mockDocument);
  }

  // User Management API Integration
  async getUserProfile() {
    const mockProfile = {
      userId: 'user123',
      email: 'josephera7@gmail.com',
      name: 'Joseph Vera',
      role: 'admin',
      company: 'SageSoft Solutions',
      preferences: { theme: 'dark', notifications: true }
    };
    return this.withMockFallback(() => this.client.get('/users/me'), mockProfile);
  }

  async updateUserProfile(updates) {
    const mockUpdate = { ...updates, updatedAt: new Date().toISOString() };
    return this.withMockFallback(() => this.client.put('/users/me', updates), mockUpdate);
  }

  async getUsers() {
    const mockUsers = {
      users: [
        { userId: 'user123', email: 'josephera7@gmail.com', name: 'Joseph Vera', role: 'admin', status: 'active' },
        { userId: 'user124', email: 'user@example.com', name: 'Test User', role: 'user', status: 'active' }
      ]
    };
    return this.withMockFallback(() => this.client.get('/admin/users'), mockUsers);
  }

  async updateUserRole(userId, role) {
    const mockRoleUpdate = { userId, role, updatedAt: new Date().toISOString() };
    return this.withMockFallback(() => this.client.post(`/admin/users/${userId}/role`, { role }), mockRoleUpdate);
  }

  // Estimations Management API Integration
  async getEstimations(params = {}) {
    return this.withApiCall(() => this.client.get('/estimations', { params }), '/estimations');
  }

  async getEstimation(estimationId) {
    const mockEstimation = {
      estimationId,
      projectName: 'Cloud Migration Project',
      clientInfo: { name: 'ABC Corp', contact: 'john@abccorp.com' },
      estimationSummary: {
        totalMonthlyCost: 8500,
        totalAnnualCost: 102000,
        costBreakdown: {
          compute: { ec2: 3500, lambda: 200 },
          storage: { ebs: 500, s3: 300 },
          networking: { vpc: 150, cloudfront: 400 },
          database: { rds: 1200 },
          security: { waf: 100, guardduty: 50 }
        }
      },
      recommendations: [
        { type: 'cost_optimization', message: 'Consider Reserved Instances for 23% savings' },
        { type: 'performance', message: 'Enable CloudFront for better global performance' }
      ]
    };
    return this.withMockFallback(() => this.client.get(`/estimations/${estimationId}`), mockEstimation);
  }

  async createEstimation(data) {
    const mockCreation = { estimationId: 'est_' + Date.now(), ...data, createdAt: new Date().toISOString() };
    return this.withMockFallback(() => this.client.post('/estimations', data), mockCreation);
  }

  async updateEstimation(estimationId, updates) {
    const mockUpdate = { estimationId, ...updates, updatedAt: new Date().toISOString() };
    return this.withMockFallback(() => this.client.put(`/estimations/${estimationId}`, updates), mockUpdate);
  }

  async deleteEstimation(estimationId) {
    const mockDelete = { estimationId, deleted: true, deletedAt: new Date().toISOString() };
    return this.withMockFallback(() => this.client.delete(`/estimations/${estimationId}`), mockDelete);
  }

  async cloneEstimation(estimationId, updates) {
    const mockClone = { estimationId: 'est_' + Date.now(), originalId: estimationId, ...updates, createdAt: new Date().toISOString() };
    return this.withMockFallback(() => this.client.post(`/estimations/${estimationId}/clone`, updates), mockClone);
  }
}

export const apiService = new ApiService();