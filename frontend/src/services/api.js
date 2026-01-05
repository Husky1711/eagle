import axios from 'axios'

// Get API URL from environment variable or use relative path for development
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('admin_token')
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

// Public API endpoints
export const publicAPI = {
  getPage: (pageId) => api.get(`/public/pages/${pageId}`),
  getCouriers: () => api.get('/public/couriers'),
  getDestinations: () => api.get('/public/destinations'),
  calculatePricing: (data) => api.post('/public/pricing/calculate', data),
  getTrackingUrl: (courierId, trackingId) =>
    api.get(`/public/tracking/${courierId}/${trackingId}`),
  getSettings: () => api.get('/public/settings'),
  submitContactForm: (data) => api.post('/public/contact', data),
  chat: (data) => api.post('/public/chat', data),
}

// Admin API endpoints
export const adminAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  logout: () => api.post('/admin/logout'),
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getPages: () => api.get('/admin/content/pages'),
  getPageContent: (pageId) => api.get(`/admin/content/${pageId}`),
  updatePageContent: (pageId, data) => api.put(`/admin/content/${pageId}`, data),
  toggleSection: (sectionId, enabled) =>
    api.patch(`/admin/sections/${sectionId}`, { enabled }),
  uploadMedia: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getMedia: () => api.get('/admin/media'),
  deleteMedia: (fileId) => api.delete(`/admin/media/${fileId}`),
  getCouriers: () => api.get('/admin/couriers'),
  createCourier: (data) => api.post('/admin/couriers', data),
  updateCourier: (courierId, data) => api.put(`/admin/couriers/${courierId}`, data),
  deleteCourier: (courierId) => api.delete(`/admin/couriers/${courierId}`),
  getPricingRules: () => api.get('/admin/pricing/rules'),
  createPricingRule: (data) => api.post('/admin/pricing/rules', data),
  updatePricingRule: (ruleId, data) => api.put(`/admin/pricing/rules/${ruleId}`, data),
  deletePricingRule: (ruleId) => api.delete(`/admin/pricing/rules/${ruleId}`),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data) => api.put('/admin/profile', data),
  changePassword: (data) => api.post('/admin/profile/password', data),
  uploadAvatar: (formData) => api.post('/admin/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  analyzeImportFile: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/pricing/import/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  previewImport: (data) => api.post('/admin/pricing/import/preview', data),
  executeImport: (data) => api.post('/admin/pricing/import/execute', data),

  // Chat APIs
  getChatUsageStats: (period, startDate = null, endDate = null) => {
    let url = `/admin/chat/usage/stats?period=${period}`
    if (startDate) url += `&start_date=${startDate}`
    if (endDate) url += `&end_date=${endDate}`
    return api.get(url)
  },
  getChatUsageLogs: (page = 1, limit = 20, startDate = null, endDate = null) => {
    let url = `/admin/chat/usage/logs?page=${page}&limit=${limit}`
    if (startDate) url += `&start_date=${startDate}`
    if (endDate) url += `&end_date=${endDate}`
    return api.get(url)
  },
  getChatPricing: () => api.get('/admin/chat/pricing'),
  updateChatPricing: (data) => api.put('/admin/chat/pricing', data),
  bulkUpdateChatPricing: (data) => api.put('/admin/chat/pricing/bulk', data),
  getChatPrompt: () => api.get('/admin/chat/prompt'),
  updateChatPrompt: (data) => api.put('/admin/chat/prompt', data),
  generateChatPrompt: (text) => api.post('/admin/chat/prompt/generate', { input_text: text }),
}

export default api

