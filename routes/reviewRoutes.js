import express from 'express';
import {
  addReview,
  addReply,
  likeReview,
  unlikeReview,
  getReviewsForCompany,
  getCompanyRatingStats
} from '../controllers/reviewController.js';
// import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Add a top-level review to a company (authenticated)
router.post('/',  addReview);

// Add a reply to a review (authenticated)
router.post('/:reviewId/reply', addReply);

// Like a review (authenticated)
router.post('/:reviewId/like', likeReview);

// Unlike a review (authenticated)
router.delete('/:reviewId/like', unlikeReview);

// Get all reviews for a company (nested with replies)
router.get('/company/:companyId', getReviewsForCompany);

// Get rating stats for a company
router.get('/company/:companyId/stats', getCompanyRatingStats);

export default router;