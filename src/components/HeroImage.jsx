import React from 'react';
import { motion } from 'framer-motion';

const HeroImage = () => {
  return (
    <div className="flex justify-center items-center">
      <motion.img
        src="https://imagedelivery.net/LqiWLm-3MGbYHtFuUbcBtA/119580eb-abd9-4191-b93a-f01938786700/public"
        alt="CashSwap Hero"
        className="w-full h-auto max-w-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
};

export default HeroImage;