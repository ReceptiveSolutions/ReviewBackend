// controllers/authController.js
import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/* ---------- Normal Email/Password Signup ---------- */
export const signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Validate required fields
    if (!firstName || !email || !password) {
      return res.status(400).json({ error: 'First name, email, and password are required' });
    }

    console.log('Signup request:', { firstName, lastName, email }); // Debug log

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.users.create({
      data: {
        first_name: firstName,
        last_name: lastName || null,
        email: email,
        password: hashedPassword,
        google_auth: false,
        status: 'active',
        type: 'normal',
        subscription: 'free'
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({ 
      message: 'User created successfully', 
      user: userWithoutPassword,
      redirectTo: '/login' // Frontend will use this to redirect
    });

  } catch (error) {
    console.error('Signup error details:', error);
    res.status(500).json({ 
      error: 'Something went wrong',
      details: error.message,
      code: error.code
    });
  }
};

/* ---------- Normal Email/Password Login ---------- */
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email: email }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if user signed up with Google (no password to compare)
    if (user.google_auth && (!user.password || user.password === '')) {
      return res.status(400).json({ 
        error: 'This account was created with Google. Please use Google Sign-In.' 
      });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        type: user.type
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Login successful', 
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        type: user.type,
        subscription: user.subscription
      },
      redirectTo: '/' // Frontend will use this to redirect to home
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Something went wrong',
      details: error.message 
    });
  }
};

/* ---------- Google OAuth Login/Signup ---------- */
export const googleAuthCallback = async (req, res) => {
  try {
    console.log('Google auth callback - req.user:', req.user);
    
    if (!req.user) {
      console.error('No user data received from Passport');
      return res.redirect('http://localhost:5173/login?error=no_user_data');
    }

    const googleUser = req.user;
    const email = googleUser.email;
    
    if (!email) {
      console.error('No email in Google user data');
      return res.redirect('http://localhost:5173/login?error=no_email');
    }

    // Check if user exists
    let user = await prisma.users.findUnique({
      where: { email: email }
    });

    if (!user) {
      console.log('Creating new user from Google auth');
      user = await prisma.users.create({
        data: {
          first_name: googleUser.firstName || googleUser.displayName.split(' ')[0],
          last_name: googleUser.lastName || googleUser.displayName.split(' ').slice(1).join(' ') || null,
          email: email,
          password: '', // Empty for Google users
          google_auth: true,
          status: 'active',
          type: 'normal',
          subscription: 'free'
        }
      });
    } else if (!user.google_auth) {
      console.log('Updating existing user with Google auth');
      user = await prisma.users.update({
        where: { email: email },
        data: { 
          google_auth: true
        }
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        type: user.type
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Google authentication successful');
    // Redirect to home page with token
    res.redirect(`http://localhost:5173/?token=${token}&google=true`);
  } catch (error) {
    console.error('Google auth error:', {
      message: error.message,
      stack: error.stack
    });
    res.redirect('http://localhost:5173/login?error=google_auth_failed');
  }
};

/* ---------- Helper function to get user profile ---------- */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT middleware
    
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        google_auth: true,
        status: true,
        type: true,
        subscription: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};