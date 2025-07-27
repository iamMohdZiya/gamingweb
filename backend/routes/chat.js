const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');
const { validateToken } = require('../service/authentication');

// Middleware to check authentication
const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const user = await validateToken(token);
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Apply auth middleware to all routes
router.use(auth);

// Chat routes
router.get('/messages/:userId', chatController.getMessages);
router.get('/friends', chatController.getFriends);
router.get('/friend-requests', chatController.getFriendRequests);
router.post('/friend-request', chatController.sendFriendRequest);
router.put('/friend-request/:requestId/accept', chatController.acceptFriendRequest);
router.get('/search', chatController.searchUsers);

module.exports = router;
