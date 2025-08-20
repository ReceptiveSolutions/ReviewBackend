// authRoutes.js
import express from 'express';
import passport from 'passport';
import { upload } from '../middleware/uploads.js';
import { signup, login, googleAuthCallback, getUserById, getAllUsers, updateUser, checkAuthOnLoad } from '../controllers/authController.js'; // Import the controller

const router = express.Router();

// ---------- Existing Routes ----------
router.post('/signup', signup);
router.post('/login', login);

router.get('/users', getAllUsers);
router.get('/me', checkAuthOnLoad);
router.get('/users/:id', getUserById);
router.put('/users/:id',upload.fields([
    { name: 'aadhar_img', maxCount: 1 },
    { name: 'pan_img', maxCount: 1 },
    { name: 'prof_img', maxCount: 1 },
  ]) , updateUser);

// ---------- Google OAuth Routes ----------
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Use your controller function instead of inline handler
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  googleAuthCallback  
);

// router.post(
//   '/upgrade-business',
//   adeToBusiness
// );

export default router;