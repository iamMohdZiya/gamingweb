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
  const { FullName, email, password } = req.body;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate salt and hash password
    const salt = require('crypto').randomBytes(16).toString('hex');
    const hashedPassword = require('crypto').createHmac('sha256', salt)
      .update(password)
      .digest('hex');

    // Create new user
    const user = new User({
      FullName,
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
        FullName: user.FullName
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