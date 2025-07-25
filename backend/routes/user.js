const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

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

module.exports = router;
