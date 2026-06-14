import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import AuthPage from '@/pages/AuthPage';
import HomePage from '@/pages/HomePage';
import ExchangePage from '@/pages/ExchangePage';
import AccountPage from '@/pages/AccountPage';
import AboutPage from '@/pages/AboutPage';
import Navbar from '@/components/Navbar';
import ChatBot from '@/components/ChatBot';

// LocalStorage keys
const STORAGE_KEYS = {
  USER: 'cashswap_user',
  THEME: 'cashswap_theme',
};

// Pages that require the user to be logged in
const PROTECTED_PAGES = ['exchange', 'account'];

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Controls the login/signup overlay
  const [showAuthModal, setShowAuthModal] = useState(false);
  // Remembers what the user was trying to do, so we can resume after login
  const [pendingAction, setPendingAction] = useState(null);

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

  // Run an action only if logged in; otherwise show the auth overlay
  // and run the action automatically once login succeeds.
  const requireAuth = (action) => {
    if (isAuthenticated) {
      action();
    } else {
      setPendingAction(() => action);
      setShowAuthModal(true);
    }
  };

  // Navigate to a page, prompting login first if that page is protected
  const handleNavigate = (pageId) => {
    if (PROTECTED_PAGES.includes(pageId)) {
      requireAuth(() => setCurrentPage(pageId));
    } else {
      setCurrentPage(pageId);
    }
  };

  // Handle user login / signup
  const handleLogin = (userData) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    setIsAuthenticated(true);
    setShowAuthModal(false);

    // Resume whatever the user originally tried to do
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
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

  // Dismiss the auth overlay without logging in
  const closeAuthModal = () => {
    setShowAuthModal(false);
    setPendingAction(null);
  };

  // Page component mapping
  const pageComponents = {
    home: <HomePage setCurrentPage={handleNavigate} />,
    exchange: <ExchangePage />,
    account: <AccountPage />,
    about: <AboutPage />,
  };

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
          setCurrentPage={handleNavigate}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
          onLoginClick={() => requireAuth(() => {})}
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
        <ChatBot requireAuth={requireAuth} />

        {/* Toast Notifications */}
        <Toaster />

        {/* Login/Signup Overlay - shown only when an action requires an account */}
        <AnimatePresence>
          {showAuthModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
            >
              <Button
                onClick={closeAuthModal}
                variant="ghost"
                size="icon"
                className="fixed top-4 right-4 z-[110] rounded-full bg-white/10 hover:bg-white/20 text-white"
                aria-label="Close login form"
              >
                <X className="h-5 w-5" />
              </Button>
              <AuthPage onLogin={handleLogin} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default App;
