// controllers/authController.js
import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/* ---------- Normal Email/Password Signup ---------- */
export const signup = async (req, res) => {
  const { firstName, lastName, email, password, address } = req.body;

  try {
    // Validate required fields
    if (!firstName || !email || !password) {
      return res.status(400).json({ error: 'First name, email, and password are required' });
    }

    console.log('Signup request:', { firstName, lastName, email,address }); // Debug log

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
        address: address || null,
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
        type: user.type,
        prof_img: user.prof_img, // Include profile image
        status: user.status,
      },
      process.env.JWT_SECRET,
      { expiresIn: '10h' }
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
        subscription: user.subscription,
        prof_img: user.prof_img, // Include profile image
        status: user.status, // Include status
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
      { expiresIn: '10h' }
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



/* ---------- Get User By ID ---------- */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        address: true,
        google_auth: true,
        status: true,
        type: true,
        subscription: true,
        noOfComp: true,
        CompaniesId: true,
        aadhar_num: true,
        pan_num: true,
        aadhar_img: true,
        pan_img: true,
        prof_img: true,
        // createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Something went wrong', message: error.message });
  }
};

/* ---------- Get All Users ---------- */
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        address: true,
        google_auth: true,
        status: true,
        type: true,
        subscription: true,
        noOfComp: true,
        CompaniesIds: true,
        aadhar_num: true,
        pan_num: true,
        aadhar_img: true,
        pan_img: true,
        prof_img: true,
        // createdAt: true,
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

/* ---------- Update User ---------- */
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, password, address, aadhar_num, pan_num } = req.body;

  console.log('Request Body:', req.body);
  console.log('Request Files:', req.files);

  try {
    // Verify JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    jwt.verify(token, process.env.JWT_SECRET);

    // Validate required fields
    if (!first_name || !email || !aadhar_num || !pan_num) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Validate field formats
    if (first_name.trim().length < 1) {
      return res.status(400).json({ error: 'First name cannot be empty or only spaces' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password && password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!/^\d{12}$/.test(aadhar_num)) {
      return res.status(400).json({ error: 'Aadhar number must be 12 digits' });
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_num)) {
      return res.status(400).json({ error: 'Invalid PAN number format' });
    }

    // Check if email is taken by another user
    const existingUser = await prisma.users.findFirst({
      where: { email, id: { not: id } },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use by another account' });
    }

    // Prepare update data
    const updateData = {
      first_name: first_name.trim(),
      last_name: last_name ? last_name.trim() : null,
      email,
      address: address || null,
      aadhar_num,
      pan_num,
      type: 'business',
      aadhar_img: req.files?.aadhar_img ? req.files.aadhar_img[0].filename : undefined,
      pan_img: req.files?.pan_img ? req.files.pan_img[0].filename : undefined,
      prof_img: req.files?.prof_img ? req.files.prof_img[0].filename : undefined,
    };

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        address: true,
        aadhar_num: true,
        pan_num: true,
        aadhar_img: true,
        pan_img: true,
        prof_img: true,
        google_auth: true,
        status: true,
        type: true,
        subscription: true,
      },
    });

    res.status(200).json({
      message: 'Business details updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update Business Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: 'Something went wrong', details: error.message });
  }
}

// Route to get user data
export const checkAuthOnLoad = async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify token (replace 'your_jwt_secret' with your actual JWT secret)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");

    // Fetch user data using Prisma
    const user = await prisma.users.findUnique({
      where: {
        id: decoded.id, // Assuming the token payload contains the user ID
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        type:true,
        prof_img: true, // Include profile image if available
        status: true,
        subscription: true, // Include subscription status
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Format response to match frontend expectations
    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      type: user.type,
      prof_img: user.prof_img, 
      status: user.status,
      subscription: user.subscription, // Default to 'free' if not set
    });
  } catch (error) {
    console.error("Get user error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
};