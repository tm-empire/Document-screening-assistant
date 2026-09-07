import React, { createContext, useContext, useState, useEffect } from 'react';
import { caseService, analyticsService } from '../services/api';

const CaseContext = createContext(null);

export const CaseProvider = ({ children }) => {
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await caseService.getCases();
      setCases(data || []);
      const statsData = await analyticsService.getDashboardStats();
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load cases:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  return (
    <CaseContext.Provider value={{
      cases,
      stats,
      loading,
      refreshCases: fetchCases
    }}>
      {children}
    </CaseContext.Provider>
  );
};

export const useCases = () => useContext(CaseContext);
