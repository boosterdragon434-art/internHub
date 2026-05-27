import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app load (Stale-While-Revalidate pattern)
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.success) {
          const freshUser = response.data.data.user;
          localStorage.setItem('user', JSON.stringify(freshUser));
          setUser(freshUser);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
        // Only clear credentials if the error is an explicit 401/403 authorization failure,
        // preventing logouts during network drops.
        if (error.response && [401, 403].includes(error.response.status)) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  // Helper to standardise authentication errors
  const handleAuthError = (error, defaultMsg) => {
    if (!error.response) {
      return 'Network error. Please check your internet connection or verify if the server is running.';
    }
    if (error.response.status === 429) {
      return error.response.data?.message || 'Too many attempts. This account is temporarily locked.';
    }
    return error.response.data?.message || defaultMsg;
  };

  // Student register
  const registerUser = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data && response.data.success) {
        const { token, user: registeredUser } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(registeredUser));
        setUser(registeredUser);
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      const message = handleAuthError(error, 'Registration failed');
      return { success: false, message };
    }
  };

  // Student login
  const loginUser = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.success) {
        const { token, user: loggedUser } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      const message = handleAuthError(error, 'Login failed');
      return { success: false, message };
    }
  };

  // Admin login
  const loginAdmin = async (email, password) => {
    try {
      const response = await api.post('/auth/admin/login', { email, password });
      if (response.data && response.data.success) {
        const { token, user: adminUser } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(adminUser));
        setUser(adminUser);
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      const message = handleAuthError(error, 'Admin login failed');
      return { success: false, message };
    }
  };

  // Guide login
  const loginGuide = async (email, password) => {
    try {
      const response = await api.post('/auth/guide/login', { email, password });
      if (response.data && response.data.success) {
        const { token, user: guideUser } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(guideUser));
        setUser(guideUser);
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      const message = handleAuthError(error, 'Guide login failed');
      return { success: false, message };
    }
  };

  // Logout
  const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Update profile in local state after controller successfully updates DB
  const updateLocalUser = (updatedUserFields) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updated = {
        ...prevUser,
        ...updatedUserFields,
      };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  // Get the correct dashboard path based on user role
  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'guide':
        return '/guide/dashboard';
      case 'student':
      default:
        return '/student/dashboard';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isGuide: user?.role === 'guide',
        isStudent: user?.role === 'student',
        register: registerUser,
        login: loginUser,
        adminLogin: loginAdmin,
        guideLogin: loginGuide,
        logout: logoutUser,
        updateLocalUser,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export { AuthContext };
