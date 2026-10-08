import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sm_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('sm_auth_token') || null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    }
  }, [token]);

  const login = async (username, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await apiClient.login(username, password);
      if (res?.success && res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('sm_auth_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      throw new Error(res?.error || 'Error al autenticar');
    } catch (err) {
      const msg = err.data?.error || err.message || 'Error de conexión';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    setToken(null);
    setAuthError(null);
    localStorage.removeItem('sm_auth_user');
    localStorage.removeItem('sm_auth_token');
  };

  const value = {
    user,
    token,
    isLoading,
    authError,
    isAuthenticated: !!user && !!token,
    isSuperAdmin: user?.rol === 'SUPER_ADMIN',
    isStoreAdmin: user?.rol === 'ADMIN_TIENDA',
    isDispatcher: user?.rol === 'DESPACHADOR',
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
