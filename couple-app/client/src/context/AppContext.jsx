import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'));
  const [myName, setMyName] = useState(() => localStorage.getItem('myName'));
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!(localStorage.getItem('userId') && localStorage.getItem('myName'))
  );

  const login = useCallback((uid, name) => {
    localStorage.setItem('userId', uid);
    localStorage.setItem('myName', name);
    setUserId(uid);
    setMyName(name);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('userId');
    localStorage.removeItem('myName');
    setUserId(null);
    setMyName(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AppContext.Provider value={{ userId, myName, isAuthenticated, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
