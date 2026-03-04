const db = require('../config/db');

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const EARTH_RADIUS = 6371; // Earth's radius in kilometers
  
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * 
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
};

// Search for exchange partners
exports.searchUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, exchangeType, radius } = req.body;

    // Get current user's location
    const [currentUser] = await db.query(
      'SELECT latitude, longitude FROM users WHERE id = ?',
      [userId]
    );

    if (!currentUser[0] || !currentUser[0].latitude || !currentUser[0].longitude) {
      return res.status(400).json({ error: 'User location not set' });
    }

    const userLat = parseFloat(currentUser[0].latitude);
    const userLng = parseFloat(currentUser[0].longitude);

    // Get all users with wallets
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.latitude, u.longitude,
              w.cash_amount, w.upi_amount
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.id != ? AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL`,
      [userId]
    );

    // Filter users based on criteria
    const matches = users.filter(user => {
      // Check if user has sufficient funds
      const hasAmount = exchangeType === 'cash-to-upi'
        ? parseFloat(user.upi_amount) >= parseFloat(amount)
        : parseFloat(user.cash_amount) >= parseFloat(amount);

      if (!hasAmount) return false;

      // Check distance
      const distance = calculateDistance(
        userLat,
        userLng,
        parseFloat(user.latitude),
        parseFloat(user.longitude)
      );

      if (distance > radius) return false;

      // Add distance to user object
      user.distance = distance.toFixed(1);
      return true;
    });

    // Sort by distance
    matches.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    res.json({
      count: matches.length,
      matches: matches.map(user => ({
        id: user.id,
        name: user.name,
        phone: user.phone,
        location: {
          lat: parseFloat(user.latitude),
          lng: parseFloat(user.longitude)
        },
        wallet: {
          cash: parseFloat(user.cash_amount) || 0,
          upi: parseFloat(user.upi_amount) || 0
        },
        distance: user.distance
      }))
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

// Create exchange request
exports.createRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, exchangeType, searchRadius } = req.body;

    const [result] = await db.query(
      `INSERT INTO exchange_requests (requester_id, amount, exchange_type, search_radius)
       VALUES (?, ?, ?, ?)`,
      [userId, amount, exchangeType, searchRadius]
    );

    res.status(201).json({
      message: 'Exchange request created',
      requestId: result.insertId
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create exchange request' });
  }
};

// Get user's exchange requests
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const [requests] = await db.query(
      `SELECT id, amount, exchange_type, search_radius, status, created_at
       FROM exchange_requests
       WHERE requester_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

// Create a match
exports.createMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.body;

    // Check if request exists
    const [requests] = await db.query(
      'SELECT requester_id FROM exchange_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Create match
    const [result] = await db.query(
      `INSERT INTO matches (request_id, provider_id)
       VALUES (?, ?)`,
      [requestId, userId]
    );

    res.status(201).json({
      message: 'Match created successfully',
      matchId: result.insertId
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
};

// Get user's matches
exports.getMyMatches = async (req, res) => {
  try {
    const userId = req.user.id;

    const [matches] = await db.query(
      `SELECT m.id, m.status, m.created_at,
              r.amount, r.exchange_type,
              u.name as partner_name, u.phone as partner_phone
       FROM matches m
       JOIN exchange_requests r ON m.request_id = r.id
       JOIN users u ON (
         CASE 
           WHEN r.requester_id = ? THEN m.provider_id
           ELSE r.requester_id
         END
       ) = u.id
       WHERE r.requester_id = ? OR m.provider_id = ?
       ORDER BY m.created_at DESC`,
      [userId, userId, userId]
    );

    res.json(matches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
};

// Update match status
exports.updateMatchStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;

    await db.query(
      'UPDATE matches SET status = ? WHERE id = ?',
      [status, matchId]
    );

    res.json({ message: 'Match status updated successfully' });
  } catch (error) {
    console.error('Update match status error:', error);
    res.status(500).json({ error: 'Failed to update match status' });
  }
};