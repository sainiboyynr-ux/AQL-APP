import React, { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../utils/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initSession() {
      try {
        const sessionUser = await authService.getCurrentUser();
        setUser(sessionUser);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initSession();
  }, []);

  const login = async (employeeId, password) => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await authService.login(employeeId, password);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError(err.message || 'Logout failed.');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
