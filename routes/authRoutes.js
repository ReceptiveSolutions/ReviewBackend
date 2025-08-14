// authRoutes.js
import express from 'express';
import passport from 'passport';
import { signup, login, googleAuthCallback } from '../controllers/authController.js'; // Import the controller

const router = express.Router();

// ---------- Existing Routes ----------
router.post('/signup', signup);
router.post('/login', login);

// ---------- Google OAuth Routes ----------
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Use your controller function instead of inline handler
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  googleAuthCallback  
);

export default router;