const jwt = require('jsonwebtoken');
const User = require('../model/user');
const { profile } = require('console');


function createTokenForUser(user) {
    const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage || null,
    };
    const secretKey = process.env.JWT_SECRET || 'your_default_secret_key';
    return jwt.sign(payload, secretKey, { expiresIn: '1h' });
}
async function validateToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) throw new Error('User Not Found!');
        return user;
    } catch (error) {
        throw new Error('Invalid Token!');
    }
}

module.exports = {
    createTokenForUser,
    validateToken
};
