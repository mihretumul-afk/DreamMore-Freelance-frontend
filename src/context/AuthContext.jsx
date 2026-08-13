import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('appworks_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const { user: userData, token: userToken } = response.data.data;
      localStorage.setItem('appworks_token', userToken);
      setToken(userToken);
      setUser(userData);
    }
    return response.data;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register', data);
    if (response.data.success) {
      const { user: userData, token: userToken } = response.data.data;
      localStorage.setItem('appworks_token', userToken);
      setToken(userToken);
      setUser(userData);
    }
    return response.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      localStorage.removeItem('appworks_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, register, logout, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
