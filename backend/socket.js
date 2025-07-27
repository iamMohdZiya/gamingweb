const { Server } = require('socket.io');
const handleChatSocket = require('./socketHandlers/chatHandler');
const handleGameSocket = require('./socketHandlers/gameHandler');

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST']
        }
    });

    io.use((socket, next) => {
        const userId = socket.handshake.auth.userId;
        if (!userId) {
            return next(new Error('invalid userId'));
        }
        socket.userId = userId;
        next();
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.userId);
        
        // Join a room with their userId for private messages
        socket.join(socket.userId);
        
        // Initialize chat handlers
        handleChatSocket(io, socket);
        
        // Initialize game handlers
        handleGameSocket(io, socket);

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.userId);
        });
    });

    return io;
};

module.exports = initializeSocket;
