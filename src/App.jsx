import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import AuthPage from '@/pages/AuthPage';
import HomePage from '@/pages/HomePage';
import ExchangePage from '@/pages/ExchangePage';
import AccountPage from '@/pages/AccountPage';
import AboutPage from '@/pages/AboutPage';
import Navbar from '@/components/Navbar';
import ChatBot from '@/components/ChatBot';

// Add this constant at the top
const API_URL = 'http://localhost:5000/api';

// LocalStorage keys
const STORAGE_KEYS = {
  USER: 'cashswap_user',
  THEME: 'cashswap_theme',
};

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize authentication and theme on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
      setIsAuthenticated(true);
    }

    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Apply theme changes to document
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (isDarkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    
    localStorage.setItem(STORAGE_KEYS.THEME, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Handle user login
  const handleLogin = (userData) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    setIsAuthenticated(false);
    setCurrentPage('home');
  };

  // Toggle between light and dark theme
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Page component mapping
  const pageComponents = {
    home: <HomePage setCurrentPage={setCurrentPage} />,
    exchange: <ExchangePage />,
    account: <AccountPage />,
    about: <AboutPage />,
  };

  // Render authentication page if not logged in
  if (!isAuthenticated) {
    return (
      <>
        <Helmet>
          <title>CashSwap - Login</title>
          <meta 
            name="description" 
            content="Login to CashSwap - Peer-to-Peer Cash & UPI Exchange Platform" 
          />
        </Helmet>
        
        <div className="min-h-screen relative overflow-hidden">
          {/* Theme Toggle Button */}
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            className="fixed top-4 right-4 z-50 rounded-full"
            aria-label="Toggle theme"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: isDarkMode ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </motion.div>
          </Button>

          <AuthPage onLogin={handleLogin} />
          <Toaster />
        </div>
      </>
    );
  }

  // Render main application
  return (
    <>
      <Helmet>
        <title>CashSwap - Peer-to-Peer Cash & UPI Exchange</title>
        <meta 
          name="description" 
          content="Exchange physical cash and digital money (UPI) with nearby users securely and conveniently" 
        />
      </Helmet>

      <div className="min-h-screen relative">
        {/* Navigation Bar */}
        <Navbar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
        
        {/* Page Content with Animations */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {pageComponents[currentPage]}
          </motion.div>
        </AnimatePresence>

        {/* Floating Chat Bot */}
        <ChatBot />
        
        {/* Toast Notifications */}
        <Toaster />
      </div>
    </>
  );
}

export default App;