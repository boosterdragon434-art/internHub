import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Transparent client-side memory cache for high-frequency GET requests
const apiCache = new Map();
const CACHE_TTL = 30000; // 30 seconds TTL

const defaultAdapter = axios.getAdapter(axios.defaults.adapter);
api.defaults.adapter = async (config) => {
  const adapter = (config.adapter && config.adapter !== api.defaults.adapter)
    ? axios.getAdapter(config.adapter)
    : defaultAdapter;

  // Only cache GET requests and exclude identity-scoped endpoints
  const noCacheEndpoints = ['/auth/me', '/attendance/my-status', '/notifications'];
  const isCacheableGet = config.method === 'get' && !noCacheEndpoints.some(ep => config.url?.includes(ep));

  if (isCacheableGet) {
    const token = localStorage.getItem('token') || 'unauth';
    const cacheKey = token.slice(-10) + ':' + config.url + '?' + JSON.stringify(config.params || {});
    const cached = apiCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Promise.resolve({
        ...cached.response,
        config,
      });
    }

    const response = await adapter(config);

    if (response.status >= 200 && response.status < 300) {
      if (apiCache.size > 200) {
        // Evict oldest entry (Map iterates in insertion order)
        const firstKey = apiCache.keys().next().value;
        apiCache.delete(firstKey);
      }

      apiCache.set(cacheKey, {
        timestamp: Date.now(),
        response: {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        },
      });
    }
    return response;
  }

  // Clear cache on any data mutations (POST, PUT, DELETE, PATCH) to maintain absolute data integrity
  if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
    apiCache.clear();
  }

  return adapter(config);
};

// Request interceptor to inject the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration/unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      const userStr = localStorage.getItem('user');
      let role = 'student';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          role = user.role || 'student';
        } catch (e) {
          console.warn('Failed to parse cached user for role detection:', e);
        }
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login if not already on an auth page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        let loginPath = '/login';
        if (role === 'admin') loginPath = '/admin/login';
        if (role === 'guide') loginPath = '/guide/login';
        
        window.location.href = `${loginPath}?expired=true`;
      }
    }
    return Promise.reject(error);
  }
);

export const clearApiCache = () => apiCache.clear();

export default api;
