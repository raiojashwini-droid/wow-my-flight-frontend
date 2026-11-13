import { useQueryClient } from '@tanstack/react-query';
import { getBackendUrl } from '../config/backend.js';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);
const backend = getBackendUrl();

const clearBusinessCache = () => {
  for (const key of Object.keys(localStorage)) {
    if (/^crm-(leads|clients|consultations|payments|documents|quotes|bookings|conversations|notifications|agents-list|consultants-list)/.test(key)) {
      localStorage.removeItem(key);
    }
  }
};

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('crm-auth-user'));
      return user?.token ? user : null;
    } catch {
      return null;
    }
  });

  const login = user => {
    if (currentUser?.id !== user.id) {
      queryClient.clear();
      clearBusinessCache();
    }
    localStorage.setItem('crm-auth-user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = () => {
    queryClient.clear();
    clearBusinessCache();
    localStorage.removeItem('crm-auth-user');
    setCurrentUser(null);
  };

  useEffect(() => {
    if (!currentUser?.token) return;
    // Don't verify or logout local demo session tokens
    if (currentUser.isDemo || currentUser.token.startsWith('wmf_demo_')) return;

    let cancelled = false;
    fetch(backend + '/api/users/me', {
      headers: { Authorization: 'Bearer ' + currentUser.token }
    }).then(async response => {
      if (response.status === 401) {
        if (!cancelled) logout();
        return;
      }
      if (!response.ok) return;
      const result = await response.json();
      if (!cancelled && result.success) {
        login({ ...result.data, token: currentUser.token });
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [currentUser?.token]);

  const refreshUser = updated => {
    if (currentUser?.id === updated.id) {
      login({
        ...currentUser,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        avatar: updated.avatar
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser?.token,
      login,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is required');
  return value;
};

export const useAuth = useAuthContext;
