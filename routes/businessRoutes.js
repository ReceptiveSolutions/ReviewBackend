import express from 'express';
import { upload } from '../middleware/uploads.js';
import { signupBusiness, upgradeToBusiness } from '../controllers/businessController.js';

const router = express.Router();

// For new user signing up as business
router.post(
  '/signup-business',
  upload.fields([
    { name: 'aadhar_img', maxCount: 1 },
    { name: 'pan_img', maxCount: 1 },
    { name: 'prof_img', maxCount: 1 },
  ]),
  signupBusiness
);

// For upgrading existing user to business
router.post(
  '/upgrade-business',
  upload.fields([
    { name: 'aadhar_img', maxCount: 1 },
    { name: 'pan_img', maxCount: 1 },
    { name: 'prof_img', maxCount: 1 },
  ]),
  upgradeToBusiness
);

export default router;
