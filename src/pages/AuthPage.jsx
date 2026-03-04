import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { authAPI } from '@/services/api';

// Initial form state
const INITIAL_FORM_STATE = {
  name: '',
  email: '',
  phone: '',
  password: '',
  location: null
};

const AuthPage = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);

  // Handle input field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Request user's geolocation
  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
        
        toast({
          title: "Location Captured! 📍",
          description: "Your location has been saved successfully.",
        });
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Unable to get your location. Please enable location services.",
          variant: "destructive"
        });
      }
    );
  };

  // Validate signup form
  const validateSignupForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.location) {
      toast({
        title: "Location Required",
        description: "Please share your location to continue.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // Handle signup
  const handleSignup = async () => {
    if (!validateSignupForm()) return;

    setIsLoading(true);

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        latitude: formData.location.lat,
        longitude: formData.location.lng,
      });

      // Save token and user data
      localStorage.setItem('cashswap_token', response.data.token);
      localStorage.setItem('cashswap_user', JSON.stringify(response.data.user));
      
      toast({
        title: "Account Created! 🎉",
        description: "Welcome to CashSwap!",
      });
      
      onLogin(response.data.user);
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error.response?.data?.error || "Unable to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter your email and password.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      // Save token and user data
      localStorage.setItem('cashswap_token', response.data.token);
      localStorage.setItem('cashswap_user', JSON.stringify(response.data.user));
      
      toast({
        title: "Welcome Back! 👋",
        description: "Login successful.",
      });
      
      onLogin(response.data.user);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.response?.data?.error || "Invalid email or password.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isSignup) {
      handleSignup();
    } else {
      handleLogin();
    }
  };

  // Toggle between signup and login
  const toggleAuthMode = () => {
    setIsSignup(!isSignup);
    setFormData(INITIAL_FORM_STATE);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-effect rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              CashSwap
            </h1>
            <p className="text-sm text-gray-300">
              {isSignup ? 'Create your account' : 'Welcome back!'}
            </p>
          </motion.div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Signup only) */}
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-white/10 border-white/20"
                  required={isSignup}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-white/10 border-white/20"
                required
                disabled={isLoading}
              />
            </div>

            {/* Phone Number (Signup only) */}
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-white/10 border-white/20"
                  required={isSignup}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="bg-white/10 border-white/20"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            {/* Location Button (Signup only) */}
            {isSignup && (
              <Button
                type="button"
                onClick={requestLocation}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <MapPin className="mr-2 h-4 w-4" />
                {formData.location ? 'Location Captured ✓' : 'Share Location'}
              </Button>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignup ? 'Creating Account...' : 'Logging in...'}
                </>
              ) : (
                <>
                  {isSignup ? 'Create Account' : 'Login'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
              disabled={isLoading}
            >
              {isSignup 
                ? 'Already have an account? Login' 
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;