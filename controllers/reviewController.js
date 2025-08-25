import pool from '../config/db.js';

export const addReview = async (req, res) => {
  try {
    const { companyId, userId, rating, text } = req.body;

    if (!companyId || !userId || !rating || !text) {
      return res.status(400).json({ error: 'Company ID, user ID, rating, and text are required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId) || !uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'Invalid company ID or user ID' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify user exists
    const userCheck = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      'INSERT INTO reviews (company_id, user_id, rating, text) VALUES ($1, $2, $3, $4) RETURNING *',
      [companyId, userId, rating, text]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, text } = req.body;

    if (!userId || !text) {
      return res.status(400).json({ error: 'User ID and text are required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reviewId) || !uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'Invalid review ID or user ID' });
    }

    // Verify user exists
    const userCheck = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      'INSERT INTO reviews (parent_id, user_id, text, company_id) VALUES ($1, $2, $3, (SELECT company_id FROM reviews WHERE id = $1)) RETURNING *',
      [reviewId, userId, text]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding reply:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const likeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reviewId) || !uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'Invalid review ID or user ID' });
    }

    // Verify user exists
    const userCheck = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      'INSERT INTO reviewLikes (review_id, user_id) VALUES ($1, $2) RETURNING *',
      [reviewId, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You have already liked this review' });
    }
    console.error('Error liking review:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unlikeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reviewId) || !uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'Invalid review ID or user ID' });
    }

    // Verify user exists
    const userCheck = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      'DELETE FROM reviewLikes WHERE review_id = $1 AND user_id = $2 RETURNING *',
      [reviewId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Like not found' });
    }

    res.status(200).json({ message: 'Like removed' });
  } catch (err) {
    console.error('Error unliking review:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// export const getReviewsForCompany = async (req, res) => {
//   try {
//     const { companyId } = req.params;

//     const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
//     if (!uuidRegex.test(companyId)) {
//       return res.status(400).json({ error: 'Invalid company ID' });
//     }

//     const result = await pool.query(
//       'SELECT * FROM reviews WHERE company_id = $1 ORDER BY created_at ASC',
//       [companyId]
//     );

//     const reviews = result.rows;
//     const reviewMap = {};
//     const topLevelReviews = [];

//     reviews.forEach(review => {
//       review.replies = [];
//       reviewMap[review.id] = review;
//     });

//     reviews.forEach(review => {
//       if (review.parent_id) {
//         if (reviewMap[review.parent_id]) {
//           reviewMap[review.parent_id].replies.push(review);
//         }
//       } else {
//         topLevelReviews.push(review);
//       }
//     });

//     for (const review of reviews) {
//       const likesResult = await pool.query(
//         'SELECT COUNT(*) as like_count FROM reviewLikes WHERE review_id = $1',
//         [review.id]
//       );
//       review.like_count = parseInt(likesResult.rows[0].like_count);
//     }

//     res.status(200).json(topLevelReviews);
//   } catch (err) {
//     console.error('Error fetching reviews:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

export const getReviewsForCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    // Fetch company info (profile img, etc.)
    const companyResult = await pool.query(
      'SELECT id, name, comp_profile_img FROM companies WHERE id = $1',
      [companyId]
    );
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    const company = companyResult.rows[0];

    // Fetch reviews with user details (including profile image)
    const result = await pool.query(
      `SELECT r.*, u.prof_img, u.first_name, last_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.company_id = $1
       ORDER BY r.created_at ASC`,
      [companyId]
    );

    const reviews = result.rows;
    const reviewMap = {};
    const topLevelReviews = [];

    reviews.forEach(review => {
      review.replies = [];
      reviewMap[review.id] = review;
    });

    reviews.forEach(review => {
      if (review.parent_id) {
        if (reviewMap[review.parent_id]) {
          reviewMap[review.parent_id].replies.push(review);
        }
      } else {
        topLevelReviews.push(review);
      }
    });

    // Attach like count for each review
    for (const review of reviews) {
      const likesResult = await pool.query(
        'SELECT COUNT(*) as like_count FROM reviewLikes WHERE review_id = $1',
        [review.id]
      );
      review.like_count = parseInt(likesResult.rows[0].like_count);
    }

    res.status(200).json({
      company: {
        id: company.id,
        name: company.name,
        comp_profile_img: company.comp_profile_img,
      },
      reviews: topLevelReviews,
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCompanyRatingStats = async (req, res) => {
  try {
    const { companyId } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    const result = await pool.query(
      'SELECT AVG(rating) as total_rating, COUNT(*) as total_reviews FROM reviews WHERE company_id = $1 AND parent_id IS NULL AND rating IS NOT NULL',
      [companyId]
    );

    const { total_rating, total_reviews } = result.rows[0];
    res.status(200).json({
      total_rating: total_rating ? parseFloat(total_rating).toFixed(1) : null,
      total_reviews: parseInt(total_reviews),
    });
  } catch (err) {
    console.error('Error fetching rating stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const dislikeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reviewId) || !uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'Invalid review ID or user ID' });
    }

    const userCheck = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      'INSERT INTO reviewDislikes (review_id, user_id) VALUES ($1, $2) RETURNING *',
      [reviewId, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You have already disliked this review' });
    }
    console.error('Error disliking review:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeDislike = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reviewId) || !uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'Invalid review ID or user ID' });
    }

    const userCheck = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      'DELETE FROM reviewDislikes WHERE review_id = $1 AND user_id = $2 RETURNING *',
      [reviewId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dislike not found' });
    }

    res.status(200).json({ message: 'Dislike removed' });
  } catch (err) {
    console.error('Error removing dislike:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const editReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, rating, text } = req.body;

    if (!userId || !text) {
      return res.status(400).json({ error: 'User ID and text are required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reviewId) || !uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'Invalid review ID or user ID' });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const userCheck = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const reviewCheck = await pool.query('SELECT parent_id, user_id FROM reviews WHERE id = $1', [reviewId]);
    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = reviewCheck.rows[0];
    if (review.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this review' });
    }

    const isReply = review.parent_id !== null;
    const query = isReply
      ? 'UPDATE reviews SET text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *'
      : 'UPDATE reviews SET rating = $1, text = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
    const values = isReply ? [text, reviewId] : [rating || reviewCheck.rows[0].rating, text, reviewId];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error editing review:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reviewId) || !uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'Invalid review ID or user ID' });
    }

    const userCheck = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const reviewCheck = await pool.query('SELECT user_id FROM reviews WHERE id = $1', [reviewId]);
    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (reviewCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this review' });
    }

    const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [reviewId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};