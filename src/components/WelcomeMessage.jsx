import React from 'react';
import { motion } from 'framer-motion';

const WelcomeMessage = () => {
  return (
    <motion.p
      className="text-xl md:text-2xl text-white max-w-2xl mx-auto leading-relaxed"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
    >
      Welcome to <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">CashSwap</span>
      {' '}- the smart way to exchange cash and UPI instantly with people nearby!
    </motion.p>
  );
};

export default WelcomeMessage;