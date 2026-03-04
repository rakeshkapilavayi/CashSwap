import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Zap, Heart } from 'lucide-react';

// Feature cards data
const features = [
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'All users are verified, and exchanges happen in person, giving you complete control and security over your transactions.',
    color: 'text-purple-400',
    delay: 0.2,
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Built on trust and mutual benefit, our community helps each other solve everyday cash-digital money challenges.',
    color: 'text-pink-400',
    delay: 0.3,
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Find matches in seconds with our location-based search. Connect, meet, and exchange within minutes.',
    color: 'text-purple-400',
    delay: 0.4,
  },
  {
    icon: Heart,
    title: 'User Friendly',
    description: 'Simple, intuitive interface designed for everyone. No complicated processes, just straightforward exchanges.',
    color: 'text-pink-400',
    delay: 0.5,
  },
];

// How it works steps
const steps = [
  {
    number: 1,
    title: 'Create Your Account',
    description: 'Sign up and set up your profile with your location and contact details.',
    color: 'bg-purple-500',
  },
  {
    number: 2,
    title: 'Set Your Wallet',
    description: 'Specify how much cash or UPI you are willing to exchange.',
    color: 'bg-pink-500',
  },
  {
    number: 3,
    title: 'Search & Match',
    description: 'Find nearby users who want to exchange in the opposite direction.',
    color: 'bg-purple-500',
  },
  {
    number: 4,
    title: 'Connect & Exchange',
    description: 'Contact your match, meet up, and complete the exchange safely.',
    color: 'bg-pink-500',
  },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Page Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            About CashSwap
          </h1>

          {/* What is CashSwap Section */}
          <div className="glass-effect rounded-2xl p-8 md:p-12 mb-8">
            <h2 className="text-3xl font-bold mb-6">What is CashSwap?</h2>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              CashSwap is a revolutionary peer-to-peer platform that bridges the gap between physical cash and digital money. 
              We connect people who need cash with those who have it, and vice versa, making money exchange simple, safe, and convenient.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              Whether you have UPI balance but need physical cash, or you have cash but need to make a digital payment, 
              CashSwap helps you find nearby users willing to exchange with you instantly.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: feature.delay, duration: 0.5 }}
                  className="glass-effect rounded-xl p-6 hover:scale-105 transition-transform"
                >
                  <Icon className={`h-12 w-12 ${feature.color} mb-4`} />
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* How It Works Section */}
          <div className="glass-effect rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6">How It Works</h2>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                  className="flex items-start space-x-4"
                >
                  <div className={`w-10 h-10 ${step.color} rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold`}>
                    {step.number}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
                    <p className="text-gray-300">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;