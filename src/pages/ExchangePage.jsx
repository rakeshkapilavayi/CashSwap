import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, IndianRupee, Smartphone, User, MessageCircle, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Slider } from '@/components/ui/slider';
import { exchangeAPI, userAPI } from '@/services/api';
import ChatWindow from '@/components/ChatWindow';  // ✅ added

// Exchange type options
const EXCHANGE_TYPES = {
  CASH_TO_UPI: 'cash-to-upi',
  UPI_TO_CASH: 'upi-to-cash',
};

// Default search radius
const DEFAULT_RADIUS = 5;
const MAX_RADIUS = 50;

const ExchangePage = () => {
  const [amount, setAmount] = useState('');
  const [exchangeType, setExchangeType] = useState(EXCHANGE_TYPES.CASH_TO_UPI);
  const [radius, setRadius] = useState([DEFAULT_RADIUS]);
  const [searchResults, setSearchResults] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // ✅ new state for chat user
  const [chatUser, setChatUser] = useState(null);

  // Load user location on mount
  useEffect(() => {
    loadUserLocation();
  }, []);

  // Fetch user location
  const loadUserLocation = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data.location) {
        setUserLocation(response.data.location);
      }
    } catch (error) {
      console.error('Failed to load location:', error);
      
      // Fallback to localStorage
      const savedUser = localStorage.getItem('cashswap_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.location) {
          setUserLocation(user.location);
        }
      }
    }
  };

  // Validate search inputs
  const validateSearch = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to exchange.",
        variant: "destructive"
      });
      return false;
    }

    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Please set your location in Account settings.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // Search for matching users
  const handleSearch = async () => {
    setHasSearched(true);
    
    if (!validateSearch()) return;

    try {
      setIsSearching(true);
      
      const response = await exchangeAPI.searchUsers({
        amount: parseFloat(amount),
        exchangeType: exchangeType,
        radius: radius[0]
      });

      setSearchResults(response.data.matches || []);

      const count = response.data.count || 0;
      const resultMessage = count > 0
        ? `${count} user${count > 1 ? 's' : ''} available within ${radius[0]}km radius.`
        : 'Try expanding your search radius or checking back later.';

      toast({
        title: `Found ${count} match${count !== 1 ? 'es' : ''}! 🎯`,
        description: resultMessage,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.response?.data?.error || "Unable to search for users. Please try again.",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // ✅ updated handleContact to open chat
  const handleContact = (user) => {
    setChatUser(user);
  };

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
            Find Exchange Partners
          </h1>

          {/* Search Form */}
          <div className="glass-effect rounded-2xl p-6 md:p-8 mb-8">
            <div className="space-y-6">
              {/* Amount Input */}
              <div>
                <Label htmlFor="amount" className="text-lg mb-2 block">
                  Amount to Exchange
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="100"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-lg"
                    disabled={isSearching}
                  />
                </div>
              </div>

              {/* Exchange Type Selection */}
              <div>
                <Label className="text-lg mb-3 block">Exchange Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={exchangeType === EXCHANGE_TYPES.CASH_TO_UPI ? 'default' : 'outline'}
                    onClick={() => setExchangeType(EXCHANGE_TYPES.CASH_TO_UPI)}
                    className="h-20 flex flex-col items-center justify-center"
                    disabled={isSearching}
                  >
                    <IndianRupee className="h-6 w-6 mb-1" />
                    <span>Cash to UPI</span>
                  </Button>
                  <Button
                    type="button"
                    variant={exchangeType === EXCHANGE_TYPES.UPI_TO_CASH ? 'default' : 'outline'}
                    onClick={() => setExchangeType(EXCHANGE_TYPES.UPI_TO_CASH)}
                    className="h-20 flex flex-col items-center justify-center"
                    disabled={isSearching}
                  >
                    <Smartphone className="h-6 w-6 mb-1" />
                    <span>UPI to Cash</span>
                  </Button>
                </div>
              </div>

              {/* Search Radius Slider */}
              <div>
                <Label className="text-lg mb-3 block">
                  Search Radius: {radius[0]} km
                </Label>
                <Slider
                  value={radius}
                  onValueChange={setRadius}
                  max={MAX_RADIUS}
                  min={1}
                  step={1}
                  className="w-full"
                  disabled={isSearching}
                />
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 text-lg"
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Search for Matches
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Search Results - Users Found */}
          {hasSearched && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold mb-4">
                Available Users ({searchResults.length})
              </h2>
              
              {searchResults.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="glass-effect rounded-xl p-6 hover:scale-[1.02] transition-transform"
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    {/* User Info */}
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-purple-400 flex-shrink-0">
                        {user.profilePhoto ? (
                          <img
                            src={`http://localhost:5000${user.profilePhoto}`}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                            <User className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Details */}
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{user.name}</h3>
                        <p className="text-gray-400 mb-2">{user.phone}</p>
                        
                        {/* Wallet Balances */}
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            <span>Cash: ₹{user.wallet.cash}</span>
                          </div>
                          <div className="flex items-center">
                            <Smartphone className="h-4 w-4 mr-1" />
                            <span>UPI: ₹{user.wallet.upi}</span>
                          </div>
                        </div>
                        
                        {/* Distance */}
                        {user.distance && (
                          <div className="flex items-center mt-2 text-sm text-purple-400">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{user.distance} km away</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Contact Button */}
                    <Button
                      onClick={() => handleContact(user)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contact
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Search Results - No Users Found */}
          {hasSearched && !isSearching && searchResults.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-12 glass-effect rounded-xl"
            >
              <Info className="h-12 w-12 mx-auto text-purple-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Matches Found</h3>
              <p className="text-gray-400 text-lg max-w-md mx-auto">
                Try increasing your search radius or check if other users have updated their wallets.
              </p>
            </motion.div>
          )}

          {/* ✅ Chat Window */}
          {chatUser && (
            <AnimatePresence>
              <ChatWindow 
                otherUser={chatUser} 
                onClose={() => setChatUser(null)} 
              />
            </AnimatePresence>
          )}

        </motion.div>
      </div>
    </div>
  );
};

export default ExchangePage;
