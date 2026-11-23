import apiClient from './api';

export const buyerApi = {
  // Buyer Profile (via Current Authenticated User)
  getProfile: () => apiClient.get('/api/auth/me'),

  // Master Crops Catalog
  getCrops: () => apiClient.get('/api/crops'),
  getCropById: (id) => apiClient.get(`/api/crops/${id}`),

  // Crop Requirements Management
  getRequirements: (params) => apiClient.get('/api/buyer/requirements', { params }),
  getRequirementById: (id) => apiClient.get(`/api/buyer/requirements/${id}`),
  getRequirementMetrics: () => apiClient.get('/api/buyer/requirements/metrics'),
  createRequirement: (data) => apiClient.post('/api/buyer/requirements', data),
  updateRequirement: (id, data) => apiClient.put(`/api/buyer/requirements/${id}`, data),
  cancelRequirement: (id) => apiClient.put(`/api/buyer/requirements/${id}/cancel`),

  // Quality-Aware Matching Engine (Phase 7)
  getRequirementMatches: (id, sort = 'best') =>
    apiClient.get(`/api/buyer/requirements/${id}/matches`, { params: { sort } }),

  // Purchase Orders
  getOrders: (params) => apiClient.get('/api/buyer/orders', { params }),
  getOrderById: (orderId) => apiClient.get(`/api/buyer/orders/${orderId}`),
  createOrder: (data) => apiClient.post('/api/buyer/orders', data),
  cancelOrder: (orderId, data) => apiClient.patch(`/api/buyer/orders/${orderId}/cancel`, data),

  // Delivery & Logistics Tracking
  getDeliveries: (params) => apiClient.get('/api/buyer/deliveries', { params }),
  getDeliveryById: (id) => apiClient.get(`/api/buyer/deliveries/${id}`),
  createDelivery: (data) => apiClient.post('/api/buyer/deliveries', data),
  confirmDeliveryReceived: (id, data) => apiClient.patch(`/api/buyer/deliveries/${id}/confirm-received`, data),

  // Financial Settlements & Payments
  getPayments: (params) => apiClient.get('/api/buyer/payments', { params }),
  getPaymentById: (id) => apiClient.get(`/api/buyer/payments/${id}`),
  getPaymentsByOrder: (orderId) => apiClient.get(`/api/buyer/payments/order/${orderId}`),
  getOrderPaymentSummary: (orderId) => apiClient.get(`/api/buyer/payments/order/${orderId}`),
  recordPayment: (data) => apiClient.post('/api/buyer/payments', data),

  // Price Analytics & Trends
  getPriceHistory: (params) => apiClient.get('/api/buyer/price-history', { params }),
  getCropPriceAnalytics: (cropId, params) => apiClient.get(`/api/buyer/price-history/analytics/${cropId}`, { params }),
  getMarketplaceSummary: (params) => apiClient.get('/api/price-history/summary', { params }),
};

export default buyerApi;
