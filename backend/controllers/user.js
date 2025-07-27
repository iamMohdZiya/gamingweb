const User = require('../model/user');



exports.handleSignIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    
    // Get user details
    const user = await User.findOne({ email }).select('-password -salt');
    
    res.json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        email: user.email,
        FullName: user.FullName,
        role: user.role
      },
      message: 'Login successful' 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Incorrect Email or Password' 
    });
  }
};

exports.handleSignUp = async (req, res) => {
  const { FullName, email, password, username: requestedUsername } = req.body;
  try {
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate or validate username
    let username;
    if (requestedUsername) {
      // If username is provided, validate it
      if (!/^[a-z0-9_-]{3,20}$/.test(requestedUsername.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Username must be 3-20 characters long and can only contain letters, numbers, underscores, and hyphens'
        });
      }
      
      // Check if username is taken
      const existingUsername = await User.findOne({ username: requestedUsername.toLowerCase() });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
      username = requestedUsername.toLowerCase();
    } else {
      // Generate unique username from full name
      username = await User.generateUniqueUsername(FullName);
    }

    // Generate salt and hash password
    const salt = require('crypto').randomBytes(16).toString('hex');
    const hashedPassword = require('crypto').createHmac('sha256', salt)
      .update(password)
      .digest('hex');

    // Create new user
    const user = new User({
      FullName,
      username,
      email,
      password: hashedPassword,
      salt
    });

    await user.save();

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        email: user.email,
        FullName: user.FullName,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Sign Up error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account. Please try again.'
    });
  }
}