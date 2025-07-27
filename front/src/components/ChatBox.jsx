import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import './ChatBox.css';

const ChatBox = ({ userId, onClose }) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef();
    const messagesEndRef = useRef();
    
    const {
        messages,
        typingUsers,
        loadMessages,
        sendMessage,
        sendTyping,
        friends
    } = useChat();

    const currentFriend = friends.find(f => f._id === userId);

    useEffect(() => {
        loadMessages(userId);
    }, [userId]);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages[userId]]);

    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            sendTyping(userId, true);
        }
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            sendTyping(userId, false);
        }, 2000);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        sendMessage(userId, message);
        setMessage('');
        setIsTyping(false);
        sendTyping(userId, false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    return (
        <div className="chat-box">
            <div className="chat-header">
                <span>{currentFriend?.FullName || 'Chat'}</span>
                <button className="close-button" onClick={onClose}>×</button>
            </div>
            <div className="chat-messages">
                {messages[userId]?.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.sender === userId ? 'received' : 'sent'}`}
                    >
                        <div className="message-content">{msg.content}</div>
                        <div className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
                {typingUsers[userId] && (
                    <div className="typing-indicator">Typing...</div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="message-input">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleTyping}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default ChatBox;
