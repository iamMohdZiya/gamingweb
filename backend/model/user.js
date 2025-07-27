const { createHmac, randomBytes } = require('crypto');
const mongoose = require('mongoose');
const { Schema, model } = require('mongoose');


// Helper function to generate username from full name
const generateUsername = (fullName) => {
    return fullName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove special characters
        .slice(0, 15); // Limit length
};

// User schema definition
const userSchema = new Schema({
    FullName: { type: String, required: true },
    username: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-z0-9_-]{3,20}$/, 'Username must be 3-20 characters long and can only contain letters, numbers, underscores, and hyphens']
    },
    email: { type: String, required: true, unique: true, match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'] },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    profileImage: {
      type: String,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER'
    },
    friends: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    friendRequests: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    gameRequests: [{
      from: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
        default: 'PENDING'
      },
      sentAt: {
        type: Date,
        default: Date.now
      }
    }],
    online: {
      type: Boolean,
      default: false
    },
    socketId: {
      type: String,
      default: ""
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    createdAt: { type: Date, default: Date.now }
});


// Generate unique username
userSchema.statics.generateUniqueUsername = async function(fullName) {
    let baseUsername = generateUsername(fullName);
    let username = baseUsername;
    let counter = 1;
    
    // Keep trying until we find a unique username
    while (await this.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
    }
    
    return username;
};

// Authenticate and generate token
userSchema.statics.matchPasswordAndGenerateToken = async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) throw new Error('User Not Found!');

  const userProvidedHash = createHmac('sha256', user.salt)
    .update(password)
    .digest('hex');

  if (user.password !== userProvidedHash) throw new Error('Incorrect Password!');

  const { createTokenForUser } = require('../service/authentication');
  return createTokenForUser(user);
};

module.exports = model('User', userSchema);
