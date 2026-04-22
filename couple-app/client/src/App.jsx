import React from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './pages/Dashboard.jsx';

function AppRouter() {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
