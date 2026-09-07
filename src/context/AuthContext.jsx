import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sentinel_user');
    return saved ? JSON.parse(saved) : {
      user_id: 'USR-OFFICER-01',
      name: 'Officer John Smith',
      email: 'officer@sentinel.id',
      role: 'OFFICER',
      status: 'ACTIVE'
    };
  });

  const [appsScriptUrl, setAppsScriptUrlState] = useState(() => {
    return localStorage.getItem('sentinel_apps_script_url') || 
           import.meta.env.VITE_APPS_SCRIPT_URL || 
           'https://script.google.com/macros/s/AKfycbw_ypd20aO42BVSVnO8uCyb4Uu1NHAJfmNzrYQOLLEYIPLkWHBMvUMwlQqstGHoxGhzTw/exec';
  });

  const login = async (email, role) => {
    const userData = await authService.login(email, role);
    setUser(userData);
    localStorage.setItem('sentinel_user', JSON.stringify(userData));
    return userData;
  };

  const switchRole = (newRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem('sentinel_user', JSON.stringify(updated));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sentinel_user');
  };

  const setAppsScriptUrl = (url) => {
    setAppsScriptUrlState(url);
    if (url) {
      localStorage.setItem('sentinel_apps_script_url', url);
    } else {
      localStorage.removeItem('sentinel_apps_script_url');
    }
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) return roles.includes(user.role);
    return user.role === roles;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      switchRole,
      hasRole,
      isAdmin: user?.role === 'ADMIN',
      isSupervisor: user?.role === 'SUPERVISOR',
      isOfficer: user?.role === 'OFFICER',
      appsScriptUrl,
      setAppsScriptUrl
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
