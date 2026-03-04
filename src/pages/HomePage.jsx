import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Wallet, Users, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Feature cards data
const features = [
  {
    icon: Wallet,
    title: 'Easy Exchange',
    description: 'Swap cash and UPI instantly with nearby users',
    color: 'text-purple-400',
  },
  {
    icon: Users,
    title: 'Find Nearby',
    description: 'Location-based matching for quick exchanges',
    color: 'text-pink-400',
  },
  {
    icon: Shield,
    title: 'Secure',
    description: 'Safe and verified peer-to-peer transactions',
    color: 'text-purple-400',
  },
  {
    icon: Zap,
    title: 'Instant',
    description: 'Connect and exchange in real-time',
    color: 'text-pink-400',
  },
];

// How it works steps
const steps = [
  {
    number: 1,
    title: 'Set Your Wallet',
    description: 'Add how much cash or UPI you want to exchange',
    color: 'bg-purple-500',
  },
  {
    number: 2,
    title: 'Find Matches',
    description: 'Search for nearby users willing to exchange',
    color: 'bg-pink-500',
  },
  {
    number: 3,
    title: 'Exchange',
    description: 'Connect and complete your exchange safely',
    color: 'bg-purple-500',
  },
];

const HomePage = ({ setCurrentPage }) => {
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Welcome to CashSwap
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            The easiest way to exchange physical cash and digital money with people nearby
          </p>
          <Button
            onClick={() => setCurrentPage('exchange')}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8 py-6"
          >
            Start Exchange
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-effect rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer"
              >
                <div className={`${feature.color} mb-4`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="glass-effect rounded-2xl p-8 md:p-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Get started with CashSwap in three simple steps
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="space-y-3"
              >
                <div className={`w-12 h-12 ${step.color} rounded-full flex items-center justify-center mx-auto text-xl font-bold`}>
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;