import apiClient from './api';

export const farmerApi = {
  // Farmer Profile
  getProfile: () => apiClient.get('/api/farmer/profile'),
  updateProfile: (data) => apiClient.put('/api/farmer/profile', data),

  // Master Crops Catalog
  getCrops: () => apiClient.get('/api/crops'),
  getCropById: (id) => apiClient.get(`/api/crops/${id}`),

  // Harvest Lots Management
  getHarvests: (params) => apiClient.get('/api/farmer/harvests', { params }),
  getHarvestById: (id) => apiClient.get(`/api/farmer/harvests/${id}`),
  createHarvest: (data) => apiClient.post('/api/farmer/harvests', data),
  updateHarvest: (id, data) => apiClient.put(`/api/farmer/harvests/${id}`, data),
  deleteHarvest: (id) => apiClient.delete(`/api/farmer/harvests/${id}`),
  getHarvestQuality: (harvestId) => apiClient.get(`/api/farmer/harvests/${harvestId}/quality`),

  // Incoming Orders
  getOrders: (params) => apiClient.get('/api/farmer/orders', { params }),
  getOrderById: (orderId) => apiClient.get(`/api/farmer/orders/${orderId}`),
  acceptOrder: (orderId) => apiClient.patch(`/api/farmer/orders/${orderId}/accept`),
  rejectOrder: (orderId, data) => apiClient.patch(`/api/farmer/orders/${orderId}/reject`, data),

  // Deliveries / Shipments
  getDeliveries: (params) => apiClient.get('/api/farmer/deliveries', { params }),
  getDeliveryById: (id) => apiClient.get(`/api/farmer/deliveries/${id}`),
  createDelivery: (data) => apiClient.post('/api/farmer/deliveries', data),
  shipDelivery: (id, data) => apiClient.patch(`/api/farmer/deliveries/${id}/ship`, data),
  markDelivered: (id) => apiClient.patch(`/api/farmer/deliveries/${id}/deliver`),

  // Payment Tracking
  getPayments: (params) => apiClient.get('/api/farmer/payments', { params }),
  getPaymentById: (id) => apiClient.get(`/api/farmer/payments/${id}`),
  getPaymentsByOrder: (orderId) => apiClient.get(`/api/farmer/payments/order/${orderId}`),

  // Price History & Market Intelligence
  getPriceHistory: (params) => apiClient.get('/api/farmer/price-history', { params }),
  getMarketplacePriceSummary: (params) => apiClient.get('/api/price-history/summary', { params }),
  getCropPriceAnalytics: (cropId) => apiClient.get(`/api/price-history/analytics/${cropId}`),
};

export default farmerApi;
