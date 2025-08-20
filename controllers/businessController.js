import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
// Add Business (for new signup)
export const signupBusiness = async (req, res) => {
  const { first_name, last_name, email, password, address, aadhar_num, pan_num } = req.body;

  console.log("Request Body:", req.body);
  console.log("Request Files:", req.files);

  try {
    // Validate required fields
    if (!first_name || !email || !password || !aadhar_num || !pan_num) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Validate field formats
    if (first_name.trim().length < 1) {
      return res.status(400).json({ error: 'First name cannot be empty or only spaces' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!/^\d{12}$/.test(aadhar_num)) {
      return res.status(400).json({ error: 'Aadhar number must be 12 digits' });
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_num)) {
      return res.status(400).json({ error: 'Invalid PAN number format' });
    }

    // Check for existing user
    const existingUser = await prisma.users.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.users.create({
      data: {
        first_name: first_name.trim(),
        last_name: last_name ? last_name.trim() : null,
        email,
        password: hashedPassword,
        address: address || null,
        google_auth: false,
        status: 'active',
        type: 'business',
        subscription: 'free',
        aadhar_num,
        pan_num,
        aadhar_img: req.files?.aadhar_img ? req.files.aadhar_img[0].filename : null,
        pan_img: req.files?.pan_img ? req.files.pan_img[0].filename : null,
        prof_img: req.files?.prof_img ? req.files.prof_img[0].filename : null,
      },
    });

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'Business account created successfully',
      user: userWithoutPassword,
      redirectTo: '/login',
    });
  } catch (error) {
    console.error('Business Signup Error:', error);
    res.status(500).json({ error: 'Something went wrong', details: error.message });
  }
};

// Convert existing user to business
export const upgradeToBusiness = async (req, res) => {
  const { email, password, aadharNum, panNum } = req.body;

  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const updatedUser = await prisma.users.update({
      where: { email },
      data: {
        type: 'business',
        aadhar_num: aadharNum,
        pan_num: panNum,
        aadhar_img: req.files?.aadharImg ? req.files.aadharImg[0].filename : user.aadhar_img,
        pan_img: req.files?.panImg ? req.files.panImg[0].filename : user.pan_img,
        prof_img: req.files?.profileImg ? req.files.profileImg[0].filename : user.profile_img,
      }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      message: 'Upgraded to Business account successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Upgrade Error:', error);
    res.status(500).json({ error: 'Something went wrong', details: error.message });
  }
};
