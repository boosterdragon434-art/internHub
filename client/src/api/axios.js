import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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

  // Only cache GET requests
  if (config.method === 'get') {
    const cacheKey = config.url + '?' + JSON.stringify(config.params || {});
    const cached = apiCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Promise.resolve({
        ...cached.response,
        config,
      });
    }

    const response = await adapter(config);

    if (response.status >= 200 && response.status < 300) {
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login if not already on an auth page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
