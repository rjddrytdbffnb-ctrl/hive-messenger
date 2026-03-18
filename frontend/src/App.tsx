// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';

import Header from './components/Header';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import TasksPage from './pages/TasksPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HelpPage from './pages/HelpPage';
import NotificationsPage from './pages/NotificationsPage';
import EmployeesPage from './pages/EmployeesPage';
import MediaGalleryPage from './pages/MediaGalleryPage';
import CalendarPage from './pages/CalendarPage';

// Защищенный роут
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; // ждём пока AuthContext восстановит сессию
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Главный компонент приложения
function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Публичные страницы (без Header)
  const publicPaths = ['/login', '/register'];
  const isPublicPage = publicPaths.includes(location.pathname);

  return (
    <div className="App" style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Header показывается ТОЛЬКО когда пользователь авторизован И не на публичной странице */}
      {isAuthenticated && !isPublicPage && <Header />}
      
      <Routes>
        {/* Публичные роуты */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Защищенные роуты */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/media" element={<ProtectedRoute><MediaGalleryPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />

        {/* Редирект на главную для неизвестных путей */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

// Главная функция App с правильным порядком провайдеров
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
