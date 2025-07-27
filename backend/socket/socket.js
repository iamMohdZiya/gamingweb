const socketIO = require('socket.io');
const { validateToken } = require('../service/authentication');
const Message = require('../model/message');
const User = require('../model/user');
const handleGameSocket = require('../socketHandlers/gameHandler');

function initializeSocket(server) {
    const io = socketIO(server, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:5174"],
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Store online users
    const onlineUsers = new Map();
    
    // Helper function to broadcast online status
    const broadcastUserStatus = async (userId, isOnline) => {
        const user = await User.findById(userId).populate('friends');
        if (user && user.friends) {
            user.friends.forEach(friend => {
                const friendSocketId = onlineUsers.get(friend._id.toString());
                if (friendSocketId) {
                    io.to(friendSocketId).emit(isOnline ? 'friendOnline' : 'friendOffline', { userId });
                }
            });
        }
    };

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                throw new Error('Authentication error');
            }
            const user = await validateToken(token);
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.user._id;
        
        // Add user to online users
        onlineUsers.set(userId.toString(), socket.id);
        
        // Update user's online status and socketId
        await User.findByIdAndUpdate(userId, { 
            online: true,
            socketId: socket.id,
            lastSeen: new Date()
        });

        // Broadcast online status to friends
        await broadcastUserStatus(userId, true);

        // Handle request for online friends
        socket.on('getOnlineFriends', async () => {
            const user = await User.findById(userId).populate('friends');
            const onlineFriendIds = user.friends
                .filter(friend => onlineUsers.has(friend._id.toString()))
                .map(friend => friend._id.toString());
            
            socket.emit('onlineFriendsList', { users: onlineFriendIds });
        });

        // Handle ping
        socket.on('ping', () => {
            socket.emit('pong');
        });

        // Handle private messages
        socket.on('private message', async (data) => {
            try {
                const message = new Message({
                    sender: userId,
                    receiver: data.to,
                    content: data.content
                });
                await message.save();

                // Send to receiver if online
                const receiverSocketId = onlineUsers.get(data.to);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('private message', {
                        message,
                        from: userId
                    });
                }
            } catch (error) {
                console.error('Message error:', error);
            }
        });

        // Handle typing status
        socket.on('typing', (data) => {
            const receiverSocketId = onlineUsers.get(data.to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing', {
                    from: userId,
                    isTyping: data.isTyping
                });
            }
        });
        
        // Handle user-online event
        socket.on('user-online', async (data) => {
            console.log('User online:', data.userId);
            // Update user's online status in the database
            await User.findByIdAndUpdate(data.userId, { 
                online: true,
                socketId: socket.id 
            });
            
            // Broadcast to friends that user is online
            await broadcastUserStatus(data.userId, true);
        });
        
        // Store user ID in socket for game events
        socket.userId = userId;
        
        // Initialize game socket handlers
        handleGameSocket(io, socket);

        // Handle disconnect
        // Handle disconnection
        const handleDisconnect = async () => {
            onlineUsers.delete(userId.toString());
            
            // Update user's online status, socketId and last seen
            await User.findByIdAndUpdate(userId, {
                online: false,
                socketId: "",
                lastSeen: new Date()
            });

            // Broadcast offline status to friends
            await broadcastUserStatus(userId, false);
        };

        socket.on('disconnect', handleDisconnect);
        socket.on('error', handleDisconnect);
    });

    return io;
}

module.exports = initializeSocket;
