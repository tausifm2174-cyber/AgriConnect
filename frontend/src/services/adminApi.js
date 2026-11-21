import apiClient from './api';

export const adminApi = {
  // Central Executive Dashboard
  getDashboard: () => apiClient.get('/api/admin/dashboard'),
  getRecentActivity: (limit = 10) => apiClient.get(`/api/admin/dashboard/recent-activity?limit=${limit}`),

  // User Management
  getUsers: (params) => apiClient.get('/api/admin/users', { params }),
  getUserById: (id) => apiClient.get(`/api/admin/users/${id}`),

  // Harvest Lots Management
  getHarvests: (status = 'ALL') => apiClient.get('/api/admin/quality/pending', { params: { status } }),

  // Quality Verification Workflow
  getQualityAssessments: (params) => apiClient.get('/api/admin/quality', { params }),
  getPendingQuality: (status) => apiClient.get('/api/admin/quality/pending', { params: { status } }),
  getQualityByHarvestId: (harvestId) => apiClient.get(`/api/admin/quality/harvests/${harvestId}`),
  getQualityById: (id) => apiClient.get(`/api/admin/quality/${id}`),
  createQualityAssessment: (data) => apiClient.post('/api/admin/quality', data),
  updateQualityAssessment: (id, data) => apiClient.put(`/api/admin/quality/${id}`, data),
  verifyQualityAssessment: (id) => apiClient.put(`/api/admin/quality/${id}/verify`),
  rejectQualityAssessment: (id, data) => apiClient.put(`/api/admin/quality/${id}/reject`, data),
  getQualityMetrics: () => apiClient.get('/api/admin/quality/metrics'),

  // Marketplace Order Monitoring
  getOrders: (params) => apiClient.get('/api/admin/orders', { params }),
  getOrderById: (orderId) => apiClient.get(`/api/admin/orders/${orderId}`),

  // Logistics & Freight Tracking
  getDeliveries: (params) => apiClient.get('/api/admin/deliveries', { params }),
  getDeliveryById: (id) => apiClient.get(`/api/admin/deliveries/${id}`),
  updateDeliveryStatus: (id, data) => apiClient.patch(`/api/admin/deliveries/${id}/status`, data),

  // Financial Settlements Audit
  getPayments: (params) => apiClient.get('/api/admin/payments', { params }),
  getPaymentById: (id) => apiClient.get(`/api/admin/payments/${id}`),
  getPaymentsByOrder: (orderId) => apiClient.get(`/api/admin/payments/order/${orderId}`),
  updatePaymentStatus: (id, data) => apiClient.patch(`/api/admin/payments/${id}/status`, data),

  // APMC Mandi & Marketplace Price History
  getPriceHistory: (params) => apiClient.get('/api/admin/price-history', { params }),
  getPriceHistorySummary: () => apiClient.get('/api/admin/price-history/summary'),
};

export default adminApi;
