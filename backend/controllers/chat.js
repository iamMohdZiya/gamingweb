const Message = require('../model/message');
const FriendRequest = require('../model/friendRequest');
const User = require('../model/user');

// Get all messages between two users
exports.getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        }).sort({ timestamp: 1 });
        
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send friend request
exports.sendFriendRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;
        
        // Check if request already exists
        const existingRequest = await FriendRequest.findOne({
            sender: req.user._id,
            receiver: receiverId
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Friend request already sent'
            });
        }

        const request = new FriendRequest({
            sender: req.user._id,
            receiver: receiverId
        });

        await request.save();
        res.json({ success: true, request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await FriendRequest.findById(requestId);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Friend request not found'
            });
        }

        // Update request status
        request.status = 'accepted';
        await request.save();

        // Add users to each other's friends list
        await User.findByIdAndUpdate(request.sender, {
            $addToSet: { friends: request.receiver }
        });
        await User.findByIdAndUpdate(request.receiver, {
            $addToSet: { friends: request.sender }
        });

        res.json({ success: true, request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get friend requests
exports.getFriendRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            receiver: req.user._id,
            status: 'pending'
        }).populate('sender', 'FullName email');

        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Search users
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const users = await User.find({
            FullName: new RegExp(query, 'i'),
            _id: { $ne: req.user._id }
        }).select('FullName email online lastSeen');

        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get friends list
exports.getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('friends', 'FullName email online lastSeen');
        
        res.json({ success: true, friends: user.friends });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
