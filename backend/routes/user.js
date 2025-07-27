const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { checkForAthenticationCookie } = require('../middleware/authentication');
const authenticate = checkForAthenticationCookie('token');
// Test connection endpoint
router.get('/test-connection', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Backend connection successful',
        timestamp: new Date().toISOString()
    });
});

router.post('/login', userController.handleSignIn);
router.post('/signup', userController.handleSignUp);

router.get('/game-requests', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('gameRequests.from', 'username avatar');
        res.json(user.gameRequests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching game requests' });
    }
});

router.patch('/game-invite/:inviteId', authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        const { inviteId } = req.params;
        
        const user = await User.findById(req.user._id);
        const invite = user.gameRequests.id(inviteId);
        
        if (!invite) {
            return res.status(404).json({ message: 'Invite not found' });
        }
        
        invite.status = status;
        await user.save();
        
        res.json({ message: 'Invite status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating invite status' });
    }
});

module.exports = router;
