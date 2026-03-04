const db = require('../config/db');

// Get or create conversation between two users
exports.getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { otherUserId } = req.body;

    const user1_id = Math.min(currentUserId, otherUserId);
    const user2_id = Math.max(currentUserId, otherUserId);

    let [conversations] = await db.query(
      `SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?`,
      [user1_id, user2_id]
    );

    let conversationId;
    if (conversations.length === 0) {
      const [result] = await db.query(
        `INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)`,
        [user1_id, user2_id]
      );
      conversationId = result.insertId;
    } else {
      conversationId = conversations[0].id;
    }

    const [otherUser] = await db.query(
      `SELECT id, name, phone FROM users WHERE id = ?`,
      [otherUserId]
    );

    res.json({ conversationId, otherUser: otherUser[0] });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
};

// Get all conversations for current user
exports.getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [conversations] = await db.query(
      `SELECT 
        c.id,
        c.last_message_at,
        CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as other_user_id,
        CASE WHEN c.user1_id = ? THEN u2.name ELSE u1.name END as other_user_name,
        CASE WHEN c.user1_id = ? THEN u2.phone ELSE u1.phone END as other_user_phone,
        (SELECT message_text FROM messages 
         WHERE conversation_id = c.id 
         ORDER BY sent_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages 
         WHERE conversation_id = c.id 
         AND receiver_id = ? 
         AND is_read = 0) as unread_count
       FROM conversations c
       JOIN users u1 ON c.user1_id = u1.id
       JOIN users u2 ON c.user2_id = u2.id
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY c.last_message_at DESC`,
      [userId, userId, userId, userId, userId, userId]
    );

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// Get messages in a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const [conversations] = await db.query(
      `SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
      [conversationId, userId, userId]
    );

    if (conversations.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [messages] = await db.query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.message_text, m.sent_at, m.is_read,
              u.name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.sent_at ASC`,
      [conversationId]
    );

    // Mark messages as read (SQLite uses 1/0 not TRUE/FALSE)
    await db.query(
      `UPDATE messages SET is_read = 1 
       WHERE conversation_id = ? AND receiver_id = ? AND is_read = 0`,
      [conversationId, userId]
    );

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { conversationId, receiverId, messageText } = req.body;

    const [conversations] = await db.query(
      `SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
      [conversationId, senderId, senderId]
    );

    if (conversations.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [result] = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text)
       VALUES (?, ?, ?, ?)`,
      [conversationId, senderId, receiverId, messageText]
    );

    // SQLite: use CURRENT_TIMESTAMP instead of NOW()
    await db.query(
      `UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [conversationId]
    );

    res.status(201).json({ id: result.insertId, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await db.query(
      `UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND receiver_id = ?`,
      [conversationId, userId]
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};