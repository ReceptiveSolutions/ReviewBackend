
import express from 'express';
import {
  addReview,
  addReply,
  likeReview,
  unlikeReview,
  editReview,
  deleteReview,
  dislikeReview,
  removeDislike,
  getReviewsForCompany,
  getCompanyRatingStats,
  getCompanyRatingDistribution,
  deleteReply
} from '../controllers/reviewController.js';

const router = express.Router();

// Add a top-level review to a company
router.post('/', addReview);

// Add a reply to a review
router.post('/:reviewId/reply', addReply);
router.delete('/:reviewId/reply', deleteReply);

// Edit a review
router.put('/:reviewId', editReview);

// Delete a review
router.delete('/:reviewId', deleteReview);

// Like a review
router.post('/:reviewId/like', likeReview);

// Unlike a review
router.delete('/:reviewId/like', unlikeReview);

// Dislike a review
router.post('/:reviewId/dislike', dislikeReview);

// Remove dislike from a review
router.delete('/:reviewId/dislike', removeDislike);

// Get all reviews for a company (nested with replies)
router.get('/company/:companyId', getReviewsForCompany);

// Get rating stats for a company
router.get('/company/:companyId/stats', getCompanyRatingStats);

router.get('/company/:companyId/ratings', getCompanyRatingDistribution);

export default router;
