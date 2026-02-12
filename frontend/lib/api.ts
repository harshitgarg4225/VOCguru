import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('propel_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('propel_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  me: () => api.get('/auth/me'),
}

// Features
export const features = {
  list: (params?: Record<string, any>) =>
    api.get('/features', { params }),
  get: (id: string) =>
    api.get(`/features/${id}`),
  update: (id: string, data: Record<string, any>) =>
    api.patch(`/features/${id}`, data),
  merge: (sourceId: string, targetId: string) =>
    api.post('/features/merge', { sourceId, targetId }),
  getSimilar: (id: string, threshold?: number) =>
    api.get(`/features/${id}/similar`, { params: { threshold } }),
}

// Roadmap
export const roadmap = {
  get: (params?: Record<string, any>) =>
    api.get('/roadmap', { params }),
  getPublic: () =>
    api.get('/roadmap/public'),
  getStats: () =>
    api.get('/roadmap/stats'),
  pushToJira: (id: string, projectKey?: string) =>
    api.post(`/roadmap/${id}/jira`, { projectKey }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/roadmap/${id}/status`, { status }),
  getQuotes: (id: string, limit?: number) =>
    api.get(`/roadmap/${id}/quotes`, { params: { limit } }),
}

// Customers
export const customers = {
  list: (params?: Record<string, any>) =>
    api.get('/customers', { params }),
  get: (id: string) =>
    api.get(`/customers/${id}`),
  sync: (email: string) =>
    api.post(`/customers/sync/${email}`),
  syncAll: () =>
    api.post('/customers/sync-all'),
}

// Notifications
export const notifications = {
  pending: (params?: Record<string, any>) =>
    api.get('/notifications/pending', { params }),
  history: (params?: Record<string, any>) =>
    api.get('/notifications/history', { params }),
  approve: (id: string) =>
    api.post(`/notifications/${id}/approve`),
  reject: (id: string, reason?: string) =>
    api.post(`/notifications/${id}/reject`, { reason }),
  regenerate: (id: string) =>
    api.post(`/notifications/${id}/regenerate`),
  send: (id: string) =>
    api.post(`/notifications/${id}/send`),
  blast: (featureId?: string) =>
    api.post('/notifications/blast', { featureId }),
  update: (id: string, data: { body?: string; subject?: string }) =>
    api.patch(`/notifications/${id}`, data),
}

// Public Portal
export const portal = {
  roadmap: (params?: Record<string, any>) =>
    api.get('/portal/roadmap', { params }),
  feature: (id: string) =>
    api.get(`/portal/features/${id}`),
  vote: (id: string, data: { email: string; is_critical?: boolean; wants_updates?: boolean }) =>
    api.post(`/portal/features/${id}/vote`, data),
  checkVote: (id: string, email: string) =>
    api.get(`/portal/features/${id}/vote-check`, { params: { email } }),
  subscribe: (email: string) =>
    api.post('/portal/subscribe', { email }),
}

// Webhooks (for manual testing)
export const webhooks = {
  manual: (data: { content: string; author_email?: string; author_name?: string }) =>
    api.post('/webhooks/manual', data),
}

export default api

