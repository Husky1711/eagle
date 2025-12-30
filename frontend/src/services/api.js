import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
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
  calculatePricing: (data) => api.post('/public/pricing/calculate', data),
  getTrackingUrl: (courierId, trackingId) =>
    api.get(`/public/tracking/${courierId}/${trackingId}`),
  getSettings: () => api.get('/public/settings'),
  submitContactForm: (data) => api.post('/public/contact', data),
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
}

export default api

