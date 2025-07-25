const { createHmac, randomBytes } = require('crypto');
const { Schema, model } = require('mongoose');


// User schema definition
const userSchema = new Schema({
    FullName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'] },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    profileImage: {
      type: String,
    },role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER'
    },
    createdAt: { type: Date, default: Date.now }
});


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
