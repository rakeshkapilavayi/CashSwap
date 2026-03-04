import React from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeftRight, User, Info, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = ({ currentPage, setCurrentPage, onLogout, isDarkMode, toggleTheme }) => {
  // Navigation menu items
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'exchange', label: 'Exchange', icon: ArrowLeftRight },
    { id: 'account', label: 'Account', icon: User },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10"
    >
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent cursor-pointer"
            onClick={() => setCurrentPage('home')}
          >
            CashSwap
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  onClick={() => setCurrentPage(item.id)}
                  className="relative"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="rounded-full"
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

            {/* Logout Button */}
            <Button
              onClick={onLogout}
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentPage(item.id)}
                className="flex-col h-auto py-2"
              >
                <Icon className="h-4 w-4 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;