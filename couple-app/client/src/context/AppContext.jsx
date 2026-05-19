import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [userId,  setUserId]  = useState(() => localStorage.getItem('userId'));
  const [myName,  setMyName]  = useState(() => localStorage.getItem('myName'));
  const [token,   setToken]   = useState(() => localStorage.getItem('token'));
  const isAuthenticated = !!(userId && myName && token);

  const login = useCallback((uid, name, jwt) => {
    localStorage.setItem('userId', uid);
    localStorage.setItem('myName', name);
    localStorage.setItem('token', jwt);
    setUserId(uid);
    setMyName(name);
    setToken(jwt);
  }, []);

  const logout = useCallback(() => {
    ['userId', 'myName', 'token'].forEach(k => localStorage.removeItem(k));
    setUserId(null);
    setMyName(null);
    setToken(null);
  }, []);

  return (
    <AppContext.Provider value={{ userId, myName, token, isAuthenticated, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
