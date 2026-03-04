const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, latitude, longitude } = req.body;

    // Check if user exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, email, phone, password_hash, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, passwordHash, latitude, longitude]
    );

    const userId = result.insertId;

    // Create wallet for user
    await db.query(
      'INSERT INTO wallets (user_id) VALUES (?)',
      [userId]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: userId, name, email, phone }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [users] = await db.query(
      'SELECT id, name, email, phone, password_hash, latitude, longitude FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get wallet info
    const [wallet] = await db.query(
      'SELECT cash_amount, upi_amount FROM wallets WHERE user_id = ?',
      [user.id]
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.latitude && user.longitude ? {
          lat: parseFloat(user.latitude),
          lng: parseFloat(user.longitude)
        } : null,
        wallet: wallet[0] || { cash_amount: 0, upi_amount: 0 }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};