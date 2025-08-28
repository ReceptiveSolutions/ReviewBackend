import axios from "axios";
import express from 'express';
const router = express.Router();
import pool from '../config/db.js';

export const getall =  async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM companies');
        res.json({
            data: result.rows,
            message: "Company route working!"
        });
    } catch (err) {
        console.error("Error fetching companies:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};


// export const addComp =  async (req, res) => {
//     try {
//         const {
//             name,
//             address,
//             website_link,
//             google_map_link,
//             categories,
//             gstin_num,
//             business_email,
//             business_phone,
//             social_links,
//             avg_rating,
//             comp_profile_img

//         } = req.body;

//         // Basic field validation
//         if (!name || !address || !business_email || !gstin_num || business_phone || google_map_link || categories) {
//             return res.status(400).json({
//                 error: "Fill In all Details."
//             });
//         }

//         // Email validation
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(business_email)) {
//             return res.status(400).json({ error: "Invalid email format." });
//         }

//         // GSTIN regex validation
//         const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
//         if (!gstRegex.test(gstin_num.toUpperCase())) {
//             return res.status(400).json({ error: "Invalid GSTIN format." });
//         }

//         // Phone validation (if provided)
//         if (business_phone && !/^[+]?[\d\s\-()]{10,15}$/.test(business_phone)) {
//             return res.status(400).json({ error: "Invalid phone number format." });
//         }

//         // URL validation (if provided)
//         const urlRegex = /^https?:\/\/.+/;
//         if (website_link && !urlRegex.test(website_link)) {
//             return res.status(400).json({ error: "Website URL should start with http:// or https://" });
//         }
//         if (google_map_link && !urlRegex.test(google_map_link)) {
//             return res.status(400).json({ error: "Google Map URL should start with http:// or https://" });
//         }

//         // GSTIN API verification - mandatory
//         console.log("first", process.env.APPLYFLOW_API_KEY);
//         if (!process.env.APPLYFLOW_API_KEY) {
//             console.error("GSTIN API key is not configured.");
//             return res.status(500).json({ error: "GSTIN verification service is unavailable." });
//         }

//         try {
//             console.log(`Verifying GSTIN: ${gstin_num}`);

//             const gstResponse = await axios.get('https://appyflow.in/api/verifyGST', {
//                 params: {
//                     key_secret: process.env.APPLYFLOW_API_KEY,
//                     gstNo: gstin_num.toUpperCase(),
//                 },
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 // timeout: 10000 // 10 second timeout
//             });

//             console.log("GSTIN API Response:", gstResponse.data);

//             // Check if the response indicates a valid GSTIN
//             if (gstResponse.data.error) {
//                 console.log("GSTIN verification failed:", gstResponse.data.message);
//                 return res.status(400).json({ error: gstResponse.data.message || "GSTIN verification failed." });
//             }

//             // Check GSTIN status
//             if (!gstResponse.data.taxpayerInfo || gstResponse.data.taxpayerInfo.sts !== 'Active') {
//                 console.log("GSTIN verification failed - Invalid or inactive GSTIN");
//                 return res.status(400).json({ error: "GSTIN is not valid or not registered." });
//             }

//             // Log credit warning if present
//             if (gstResponse.data.message && gstResponse.data.message.includes("paid credits")) {
//                 console.warn("Appyflow Credit Warning:", gstResponse.data.message);
//             }

//             // GSTIN is verified
//             console.log("GSTIN verified successfully");
//         } catch (error) {
//             console.error("GSTIN API error details:", {
//                 message: error.message,
//                 response: error.response?.data,
//                 status: error.response?.status,
//                 statusText: error.response?.statusText
//             });

//             // Handle specific API errors
//             if (error.response?.status === 401) {
//                 return res.status(500).json({ error: "GSTIN verification failed: Invalid API key." });
//             } else if (error.response?.status === 404) {
//                 return res.status(400).json({ error: "GSTIN not found in the database." });
//             } else if (error.response?.status === 429) {
//                 return res.status(429).json({ error: "GSTIN verification rate limit exceeded. Please try again later." });
//             } else if (error.code === 'ECONNABORTED') {
//                 return res.status(504).json({ error: "GSTIN verification request timed out." });
//             } else {
//                 return res.status(500).json({ error: "GSTIN verification service is unavailable. Please try again later.", error: error.message });
//             }
//         }

//         // Process categories
//         let processedCategories = null;
//         if (categories) {
//             if (Array.isArray(categories)) {
//                 processedCategories = JSON.stringify(categories.filter(cat => cat.trim()));
//             } else if (typeof categories === 'string') {
//                 processedCategories = JSON.stringify(
//                     categories.split(",").map(c => c.trim()).filter(c => c)
//                 );
//             }
//         }

//         // Process social links - only include non-empty links
//         let processedSocialLinks = null;
//         if (social_links && typeof social_links === 'object') {
//             const nonEmptyLinks = Object.fromEntries(
//                 Object.entries(social_links).filter(([key, value]) => value && value.trim() !== '')
//             );
//             if (Object.keys(nonEmptyLinks).length > 0) {
//                 processedSocialLinks = JSON.stringify(nonEmptyLinks);
//             }
//         }

//         // Insert into database
//         const result = await pool.query(
//             `INSERT INTO companies 
//             (name, address, website_link, google_map_link, categories, gstin_num, business_email, business_phone, social_links, avg_rating)
//             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//             RETURNING *`,
//             [
//                 name.trim(),
//                 address.trim(),
//                 website_link || null,
//                 google_map_link || null,
//                 processedCategories,
//                 gstin_num.toUpperCase(),
//                 business_email.toLowerCase().trim(),
//                 business_phone || null,
//                 processedSocialLinks,
//                 avg_rating || null
//             ]
//         );

//         // Send success response
//         res.status(201).json({
//             message: "Company registered successfully!",
//             company: result.rows[0],
//             gstin_verified: true
//         });

//     } catch (err) {
//         console.error("Database insert error:", err);

//         // Handle specific database errors
//         if (err.code === '23505') { // Unique constraint violation
//             if (err.constraint?.includes('business_email')) {
//                 return res.status(400).json({ error: "A company with this email already exists." });
//             }
//             if (err.constraint?.includes('gstin_num')) {
//                 return res.status(400).json({ error: "A company with this GSTIN already exists." });
//             }
//         }

//         res.status(500).json({ error: "Internal server error. Please try again." });
//     }
// };
export const addComp = async (req, res) => {
  try {
    const {
      name,
      address,
      website_link,
      google_map_link,
      categories,
      gstin_num,
      business_email,
      business_phone,
      social_links,
      description,
      userId
    } = req.body;

    // Basic field validation
    if (!name || !address || !business_email || !gstin_num) {
      return res.status(400).json({
        error: "Fill in all required details."
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(business_email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // GSTIN regex validation
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstin_num.toUpperCase())) {
      return res.status(400).json({ error: "Invalid GSTIN format." });
    }

    // Phone validation
    if (business_phone && !/^[+]?[\d\s\-()]{10,15}$/.test(business_phone)) {
      return res.status(400).json({ error: "Invalid phone number format." });
    }

    // URL validation
    const urlRegex = /^https?:\/\/.+/;
    if (website_link && !urlRegex.test(website_link)) {
      return res.status(400).json({ error: "Website URL should start with http:// or https://" });
    }
    if (google_map_link && !urlRegex.test(google_map_link)) {
      return res.status(400).json({ error: "Google Map URL should start with http:// or https://" });
    }

    // GSTIN API Verification
    if (!process.env.APPLYFLOW_API_KEY) {
      console.error("GSTIN API key is not configured.");
      return res.status(500).json({ error: "GSTIN verification service unavailable." });
    }

    try {
      const gstResponse = await axios.get("https://appyflow.in/api/verifyGST", {
        params: {
          key_secret: process.env.APPLYFLOW_API_KEY,
          gstNo: gstin_num.toUpperCase(),
        },
        headers: { "Content-Type": "application/json" },
      });

      if (gstResponse.data.error) {
        return res.status(400).json({ error: gstResponse.data.message || "GSTIN verification failed." });
      }

      if (!gstResponse.data.taxpayerInfo || gstResponse.data.taxpayerInfo.sts !== "Active") {
        return res.status(400).json({ error: "GSTIN is not valid or not registered." });
      }
    } catch (error) {
      return res.status(500).json({ error: "GSTIN verification failed.", details: error.message });
    }

    // Process categories
    let processedCategories = null;
    if (categories) {
      if (Array.isArray(categories)) {
        processedCategories = JSON.stringify(categories.filter(c => c.trim()));
      } else if (typeof categories === "string") {
        processedCategories = JSON.stringify(
          categories.split(",").map(c => c.trim()).filter(c => c)
        );
      }
    }

    // Process social links
    let processedSocialLinks = null;
    if (social_links && typeof social_links === "object") {
      const nonEmptyLinks = Object.fromEntries(
        Object.entries(social_links).filter(([_, value]) => value && value.trim() !== "")
      );
      if (Object.keys(nonEmptyLinks).length > 0) {
        processedSocialLinks = JSON.stringify(nonEmptyLinks);
      }
    }

    // Handle comp_profile_img from multer
    const compProfileImg = req.files && req.files.comp_profile_img ? req.files.comp_profile_img[0].filename : null;

    // Insert into database
    const result = await pool.query(
      `INSERT INTO companies 
        (name, address, website_link, google_map_link, categories, gstin_num, business_email, business_phone, social_links, avg_rating, comp_profile_img, description, isVerified, userId)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, DEFAULT, $13)
       RETURNING *`,
      [
        name.trim(),
        address.trim(),
        website_link || null,
        google_map_link || null,
        processedCategories,
        gstin_num.toUpperCase(),
        business_email.toLowerCase().trim(),
        business_phone || null,
        processedSocialLinks,
        null, // avg_rating set to null as per default
        compProfileImg,
        description || null,
        userId || null
      ]
    );

    res.status(201).json({
      message: "Company registered successfully!",
      company: result.rows[0],
      gstin_verified: true
    });
  } catch (err) {
    console.error("Database insert error:", err);

    if (err.code === "23505") { // Unique violation
      if (err.constraint?.includes("business_email")) {
        return res.status(400).json({ error: "A company with this email already exists." });
      }
      if (err.constraint?.includes("gstin_num")) {
        return res.status(400).json({ error: "A company with this GSTIN already exists." });
      }
    }

    res.status(500).json({ error: "Internal server error. Please try again." });
  }
};


export const deleteComp = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM companies WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.json({
            message: "Company deleted successfully!",
            deletedCompany: result.rows[0]
        });
    } catch (err) {
        console.error("Error deleting company:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Update company by ID
export const updateComp = async (req, res) => {
    const { id } = req.params;
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    const {
        name,
        address,
        website_link,
        google_map_link,
        categories,
        gstin_num,
        business_email,
        social_links,
        avg_rating,
        business_phone
    } = req.body;

    try {
        // Fetch existing company first
        const existing = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
        if (existing.rowCount === 0) {
            return res.status(404).json({ error: "Company not found" });
        }

        const company = existing.rows[0];

        // Prepare updated values (keep existing if not provided)
        const updatedCompany = {
            name: name || company.name,
            address: address || company.address,
            website_link: website_link || company.website_link,
            google_map_link: google_map_link || company.google_map_link,
            categories: categories
                ? JSON.stringify(Array.isArray(categories) ? categories : categories.split(",").map(c => c.trim()))
                : company.categories,
            gstin_num: gstin_num || company.gstin_num,
            business_email: business_email || company.business_email,
            social_links: social_links ? JSON.stringify(social_links) : company.social_links,
            avg_rating: avg_rating || company.avg_rating,
            business_phone: business_phone || company.business_phone
        };

        // Update the company
        const result = await pool.query(
            `UPDATE companies SET
            name = $1,
            address = $2,
            website_link = $3,
            google_map_link = $4,
            categories = $5,
            gstin_num = $6,
            business_email = $7,
            social_links = $8,
            avg_rating = $9,
            business_phone = $10
            WHERE id = $11
            RETURNING *`,
            [
                updatedCompany.name,
                updatedCompany.address,
                updatedCompany.website_link,
                updatedCompany.google_map_link,
                updatedCompany.categories,
                updatedCompany.gstin_num,
                updatedCompany.business_email,
                updatedCompany.social_links,
                updatedCompany.avg_rating,
                updatedCompany.business_phone,
                id
            ]
        );

        res.json({
            message: "Company updated successfully!",
            company: result.rows[0]
        });

    } catch (err) {
        console.error("Error updating company:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getbyIdComp= async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "SELECT * FROM companies WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching company:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getbyUserIdCompany = async (req, res) => {
  try {
    const { userId } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await pool.query(
      'SELECT * FROM companies WHERE userid = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No company found for this user' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching company by user ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



export const verifyComp= async (req, res) => {
    try {
        const { id } = req.params;

        // Update isVerified to true
        const result = await pool.query(
            "UPDATE companies SET isVerified = true WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.json({
            message: "Company verified successfully",
            company: result.rows[0]
        });
    } catch (err) {
        console.error("Error verifying company:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};


export default router;
