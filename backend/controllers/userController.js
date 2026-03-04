const db = require('../config/db');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.latitude, u.longitude, u.profile_photo,
              w.cash_amount, w.upi_amount
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.latitude && user.longitude ? {
        lat: parseFloat(user.latitude),
        lng: parseFloat(user.longitude)
      } : null,
      profilePhoto: user.profile_photo,
      wallet: {
        cash: parseFloat(user.cash_amount) || 0,
        upi: parseFloat(user.upi_amount) || 0
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, latitude, longitude } = req.body;

    await db.query(
      `UPDATE users 
       SET name = ?, email = ?, phone = ?, latitude = ?, longitude = ?
       WHERE id = ?`,
      [name, email, phone, latitude, longitude, userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Update wallet amounts
exports.updateWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cash, upi } = req.body;

    await db.query(
      `UPDATE wallets 
       SET cash_amount = ?, upi_amount = ?
       WHERE user_id = ?`,
      [cash, upi, userId]
    );

    res.json({ 
      message: 'Wallet updated successfully',
      wallet: { cash, upi }
    });
  } catch (error) {
    console.error('Update wallet error:', error);
    res.status(500).json({ error: 'Failed to update wallet' });
  }
};

// Update location
exports.updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    await db.query(
      `UPDATE users 
       SET latitude = ?, longitude = ?
       WHERE id = ?`,
      [latitude, longitude, userId]
    );

    res.json({ 
      message: 'Location updated successfully',
      location: { lat: latitude, lng: longitude }
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

// Get all users (for admin purposes - optional)
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.latitude, u.longitude,
              w.cash_amount, w.upi_amount, u.created_at
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       ORDER BY u.created_at DESC`
    );

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const fs = require('fs');
const path = require('path');

// Upload profile photo
exports.uploadPhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get old photo path to delete later
    const [users] = await db.query(
      'SELECT profile_photo FROM users WHERE id = ?',
      [userId]
    );

    const oldPhoto = users[0]?.profile_photo;

    // Update database with new photo path
    const photoPath = `/uploads/profiles/${req.file.filename}`;
    
    await db.query(
      'UPDATE users SET profile_photo = ? WHERE id = ?',
      [photoPath, userId]
    );

    // Delete old photo if it exists
    if (oldPhoto) {
      const oldPhotoPath = path.join(__dirname, '..', oldPhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    res.json({
      message: 'Photo uploaded successfully',
      photoUrl: photoPath
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    
    // Delete uploaded file if database update fails
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/profiles', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};

// Delete profile photo
exports.deletePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current photo path
    const [users] = await db.query(
      'SELECT profile_photo FROM users WHERE id = ?',
      [userId]
    );

    const photoPath = users[0]?.profile_photo;

    if (!photoPath) {
      return res.status(404).json({ error: 'No profile photo to delete' });
    }

    // Delete photo from database
    await db.query(
      'UPDATE users SET profile_photo = NULL WHERE id = ?',
      [userId]
    );

    // Delete physical file
    const fullPath = path.join(__dirname, '..', photoPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
};