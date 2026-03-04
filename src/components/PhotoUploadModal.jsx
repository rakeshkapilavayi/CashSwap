import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { userAPI } from '@/services/api';

const PhotoUploadModal = ({ currentPhoto, onClose, onPhotoUpdated }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPEG, PNG, GIF, or WebP).",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload photo
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await userAPI.uploadPhoto(formData);

      toast({
        title: "Photo Uploaded! 📸",
        description: "Your profile photo has been updated successfully.",
      });

      onPhotoUpdated(response.data.photoUrl);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.response?.data?.error || "Unable to upload photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete photo
  const handleDelete = async () => {
    if (!currentPhoto) return;

    setIsDeleting(true);

    try {
      await userAPI.deletePhoto();

      toast({
        title: "Photo Deleted",
        description: "Your profile photo has been removed.",
      });

      onPhotoUpdated(null);
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "Unable to delete photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-md glass-effect rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h3 className="text-xl font-bold">Profile Photo</h3>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current/Preview Photo */}
            <div className="flex justify-center">
              <div className="relative w-48 h-48">
                {previewUrl || currentPhoto ? (
                  <img
                    src={previewUrl || `http://localhost:5000${currentPhoto}`}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover border-4 border-purple-400"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <Camera className="h-20 w-20 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* File Input */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
                disabled={isUploading || isDeleting}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Photo
              </Button>
              
              {selectedFile && (
                <p className="text-sm text-gray-400 mt-2 text-center">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {selectedFile && (
                <Button
                  onClick={handleUpload}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  disabled={isUploading || isDeleting}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </>
                  )}
                </Button>
              )}

              {currentPhoto && !selectedFile && (
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  className="flex-1"
                  disabled={isUploading || isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Photo
                    </>
                  )}
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Accepted formats: JPEG, PNG, GIF, WebP • Max size: 5MB
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoUploadModal;