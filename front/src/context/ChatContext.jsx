import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import io from 'socket.io-client';
import { API_URL } from '../config/api';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineFriends, setOnlineFriends] = useState([]);
    const [messages, setMessages] = useState({});
    const [currentChat, setCurrentChat] = useState(null);
    const [typingUsers, setTypingUsers] = useState({});
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const currentUser = JSON.parse(localStorage.getItem('user'));

    // Load friends when component mounts
    useEffect(() => {
        const loadFriends = async () => {
            try {
                const response = await api.get('/user/friends');
                setFriends(response.data.friends || []);
            } catch (error) {
                console.error('Error loading friends:', error);
            }
        };
        
        if (currentUser) {
            loadFriends();
        }
    }, [currentUser]);
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !currentUser) return;

        // Initialize socket connection
        const newSocket = io(API_URL, {
            auth: { token },
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
            transports: ['websocket']
        });
        
        // Emit user-online event when connected
        newSocket.on('connect', () => {
            newSocket.emit('user-online', { userId: currentUser._id });
        });

        // Socket event listeners
        newSocket.on('connect', () => {
            console.log('Connected to chat server');
            // Request initial online status of friends
            newSocket.emit('getOnlineFriends');
        });

        // Refresh online friends every 30 seconds
        const onlineFriendsInterval = setInterval(() => {
            if (newSocket.connected) {
                newSocket.emit('getOnlineFriends');
            }
        }, 30000);

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            // Attempt to reconnect after connection error
            setTimeout(() => {
                newSocket.connect();
            }, 1000);
        });

        newSocket.on('private message', ({ message, from }) => {
            setMessages(prev => {
                const updatedMessages = { ...prev };
                const conversationKey = from === currentUser._id ? message.receiver : from;
                
                if (!updatedMessages[conversationKey]) {
                    updatedMessages[conversationKey] = [];
                }
                
                // Check if message already exists to prevent duplicates
                const messageExists = updatedMessages[conversationKey].some(
                    msg => msg._id === message._id
                );
                
                if (!messageExists) {
                    updatedMessages[conversationKey] = [
                        ...updatedMessages[conversationKey],
                        {
                            ...message,
                            sender: from
                        }
                    ];
                }
                
                return updatedMessages;
            });

            // If we're not currently chatting with this person, show notification
            if (currentChat !== from) {
                // Create notification
                new Notification('New Message', {
                    body: 'You have received a new message',
                    icon: '/path/to/icon.png'
                });
            }
        });

        newSocket.on('friendOnline', ({ userId }) => {
            setOnlineFriends(prev => {
                if (!prev.includes(userId)) {
                    return [...prev, userId];
                }
                return prev;
            });
        });

        newSocket.on('friendOffline', ({ userId }) => {
            setOnlineFriends(prev => prev.filter(id => id !== userId));
        });

        newSocket.on('onlineFriendsList', ({ users }) => {
            setOnlineFriends(users);
        });

        newSocket.on('typing', ({ from, isTyping }) => {
            setTypingUsers(prev => ({
                ...prev,
                [from]: isTyping
            }));
        });

        newSocket.on('friendRequest', ({ request }) => {
            // Update pending requests in real-time
            setPendingRequests(prev => [...prev, request]);
        });

        newSocket.on('friendRequestAccepted', ({ friend }) => {
            // Update friends list in real-time
            setFriends(prev => [...prev, friend]);
        });
        
        newSocket.on('receiveGameInvite', (data) => {
            // Update UI to show game invite notification
        });
        
        newSocket.on('updateGameRequests', () => {
            // Trigger UI update for game requests
        });

        setSocket(newSocket);

        // Ping for connection status every 30 seconds
        const pingInterval = setInterval(() => {
            if (newSocket.connected) {
                newSocket.emit('ping');
            }
        }, 30000);

        return () => {
            clearInterval(pingInterval);
            clearInterval(onlineFriendsInterval);
            newSocket.close();
        };
    }, []);

    // Load messages for a specific chat
    const loadMessages = async (userId) => {
        try {
            const response = await api.get(`/chat/messages/${userId}`);
            setMessages(prev => ({
                ...prev,
                [userId]: response.data.messages
            }));
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    // Send a message
    const sendMessage = async (to, content) => {
        if (!socket || !currentUser) return;

        try {
            const newMessage = {
                sender: currentUser._id,
                receiver: to,
                content,
                timestamp: new Date()
            };

            // Emit message to server
            socket.emit('private message', { to, content });

            // Optimistically add message to UI
            setMessages(prev => ({
                ...prev,
                [to]: [...(prev[to] || []), newMessage]
            }));

            // Save message to database
            try {
                await api.post('/chat/messages', {
                    receiverId: to,
                    content
                });
            } catch (error) {
                console.error('Error saving message:', error);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Send typing status
    const sendTyping = (to, isTyping) => {
        if (!socket) return;
        socket.emit('typing', { to, isTyping });
    };

    const value = {
        socket,
        onlineFriends,
        messages,
        currentChat,
        typingUsers,
        friends,
        pendingRequests,
        setCurrentChat,
        setFriends,
        setPendingRequests,
        loadMessages,
        sendMessage,
        sendTyping
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
