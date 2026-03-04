import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Wallet, Camera, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { userAPI } from '@/services/api';
import PhotoUploadModal from '@/components/PhotoUploadModal';

const AccountPage = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    location: null,
    wallet: { cash: 0, upi: 0 },
    profilePhoto: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Load user data on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Fetch user profile from database
  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getProfile();
      
      const profileData = response.data;
      setUserData({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        location: profileData.location,
        wallet: {
          cash: profileData.wallet?.cash || 0,
          upi: profileData.wallet?.upi || 0
        },
        profilePhoto: profileData.profilePhoto
      });

      // Update localStorage
      localStorage.setItem('cashswap_user', JSON.stringify(profileData));

    } catch (error) {
      console.error('Load profile error:', error);
      toast({
        title: "Failed to Load Profile",
        description: error.response?.data?.error || "Unable to fetch your profile data.",
        variant: "destructive"
      });

      // Fallback to localStorage
      const savedUser = localStorage.getItem('cashswap_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setUserData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          location: user.location,
          wallet: user.wallet || { cash: 0, upi: 0 },
          profilePhoto: user.profilePhoto
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle basic input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  // Handle wallet amount changes
  const handleWalletChange = (type, value) => {
    setUserData(prev => ({
      ...prev,
      wallet: { 
        ...prev.wallet, 
        [type]: parseFloat(value) || 0 
      }
    }));
  };

  // Save all changes to database
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update profile
      await userAPI.updateProfile({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        latitude: userData.location?.lat,
        longitude: userData.location?.lng
      });

      // Update wallet
      await userAPI.updateWallet({
        cash: userData.wallet.cash,
        upi: userData.wallet.upi
      });

      // Update localStorage
      localStorage.setItem('cashswap_user', JSON.stringify(userData));
      
      toast({
        title: "Profile Updated! ✨",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error.response?.data?.error || "Unable to save your changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open photo upload modal
  const handlePhotoUpload = () => {
    setShowPhotoModal(true);
  };

  // Handle photo update callback
  const handlePhotoUpdated = (newPhotoUrl) => {
    setUserData(prev => ({ ...prev, profilePhoto: newPhotoUrl }));
    
    // Update localStorage
    const savedUser = JSON.parse(localStorage.getItem('cashswap_user'));
    savedUser.profilePhoto = newPhotoUrl;
    localStorage.setItem('cashswap_user', JSON.stringify(savedUser));
  };

  // Update user location
  const updateLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        try {
          // Update location in database
          await userAPI.updateLocation({
            latitude: newLocation.lat,
            longitude: newLocation.lng
          });

          setUserData(prev => ({
            ...prev,
            location: newLocation
          }));
          
          toast({
            title: "Location Updated! 📍",
            description: "Your location has been refreshed.",
          });
        } catch (error) {
          toast({
            title: "Update Failed",
            description: "Unable to update location in database.",
            variant: "destructive"
          });
        }
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Unable to get your location. Please check your permissions.",
          variant: "destructive"
        });
      }
    );
  };

  // Format location display
  const formatLocation = () => {
    if (!userData.location) return 'Not set';
    return `${userData.location.lat.toFixed(4)}, ${userData.location.lng.toFixed(4)}`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          {/* Page Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            My Account
          </h1>

          {/* Profile Section */}
          <div className="glass-effect rounded-2xl p-6 md:p-8 mb-6">
            {/* Profile Photo - UPDATED SECTION */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-400 mb-4">
                  {userData.profilePhoto ? (
                    <img
                      src={`http://localhost:5000${userData.profilePhoto}`}
                      alt={userData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <User className="h-16 w-16 text-white" />
                    </div>
                  )}
                </div>
                <Button
                  onClick={handlePhotoUpload}
                  size="icon"
                  className="absolute bottom-4 right-0 rounded-full bg-purple-500 hover:bg-purple-600"
                  aria-label="Upload profile photo"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-2xl font-bold">{userData.name || 'User'}</h2>
            </div>

            {/* Profile Form */}
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <Label htmlFor="name" className="flex items-center mb-2">
                  <User className="h-4 w-4 mr-2" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="bg-white/10 border-white/20"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="flex items-center mb-2">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className="bg-white/10 border-white/20"
                />
              </div>

              {/* Phone Number */}
              <div>
                <Label htmlFor="phone" className="flex items-center mb-2">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 XXXXX XXXXX"
                  className="bg-white/10 border-white/20"
                />
              </div>

              {/* Location */}
              <div>
                <Label className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  Location
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={formatLocation()}
                    disabled
                    className="bg-white/10 border-white/20"
                  />
                  <Button 
                    onClick={updateLocation} 
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Settings Section */}
          <div className="glass-effect rounded-2xl p-6 md:p-8 mb-6">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <Wallet className="h-6 w-6 mr-2 text-purple-400" />
              Wallet Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cash Amount */}
              <div>
                <Label htmlFor="cash" className="mb-2 block">
                  Cash Available (₹)
                </Label>
                <Input
                  id="cash"
                  type="number"
                  min="0"
                  step="100"
                  value={userData.wallet.cash}
                  onChange={(e) => handleWalletChange('cash', e.target.value)}
                  placeholder="0"
                  className="bg-white/10 border-white/20"
                />
              </div>

              {/* UPI Amount */}
              <div>
                <Label htmlFor="upi" className="mb-2 block">
                  UPI Available (₹)
                </Label>
                <Input
                  id="upi"
                  type="number"
                  min="0"
                  step="100"
                  value={userData.wallet.upi}
                  onChange={(e) => handleWalletChange('upi', e.target.value)}
                  placeholder="0"
                  className="bg-white/10 border-white/20"
                />
              </div>
            </div>

            <p className="text-sm text-gray-400 mt-4">
              Set the amounts you're willing to exchange. This will be visible to other users when they search.
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 text-lg"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Save Changes
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Photo Upload Modal - ADD THIS AT THE END */}
      {showPhotoModal && (
        <PhotoUploadModal
          currentPhoto={userData.profilePhoto}
          onClose={() => setShowPhotoModal(false)}
          onPhotoUpdated={handlePhotoUpdated}
        />
      )}
    </div>
  );
};

export default AccountPage;