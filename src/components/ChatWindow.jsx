import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatAPI } from '@/services/api';
import { toast } from '@/components/ui/use-toast';

const ChatWindow = ({ otherUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = JSON.parse(localStorage.getItem('cashswap_user')).id;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversation and messages
  useEffect(() => {
    loadConversation();
  }, [otherUser]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load or create conversation
  const loadConversation = async () => {
    try {
      setIsLoading(true);
      
      // Get or create conversation
      const convResponse = await chatAPI.getOrCreateConversation(otherUser.id);
      setConversationId(convResponse.data.conversationId);

      // Load messages
      const messagesResponse = await chatAPI.getMessages(convResponse.data.conversationId);
      setMessages(messagesResponse.data);
    } catch (error) {
      console.error('Load conversation error:', error);
      toast({
        title: "Failed to Load Chat",
        description: "Unable to load conversation.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversationId) return;

    setIsSending(true);

    try {
      await chatAPI.sendMessage(conversationId, otherUser.id, newMessage.trim());

      // Add message to local state
      const newMsg = {
        id: Date.now(),
        sender_id: currentUserId,
        receiver_id: otherUser.id,
        message_text: newMessage.trim(),
        sent_at: new Date().toISOString(),
        is_read: false
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: "Failed to Send",
        description: "Unable to send message.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="w-full max-w-2xl h-[600px] glass-effect rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header - UPDATED SECTION */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
              {otherUser.profilePhoto ? (
                <img
                  src={`http://localhost:5000${otherUser.profilePhoto}`}
                  alt={otherUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">{otherUser.name}</h3>
              <p className="text-sm text-white/80">{otherUser.phone}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white/10 text-gray-100'
                    }`}
                  >
                    <p className="break-words">{message.message_text}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                      {formatTime(message.sent_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="bg-white/10 border-white/20"
              disabled={isSending || isLoading}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ChatWindow;