import express from "express";
import {
    getall,
    addComp,
    deleteComp,
    updateComp,
    getbyIdComp,
    verifyComp
} from "../controllers/companyController.js"; // adjust path if needed
import { upload } from '../middleware/uploads.js';
const router = express.Router();

// GET all companies
router.get("/all", getall);

// GET company by ID
router.get("/:id", getbyIdComp);

// POST new company
router.post("/register",upload.fields([{name:'comp_profile_img', maxCount:1}]) ,addComp);

// PATCH update company
router.put("/:id", upload.fields([{name:'comp-profile_img', maxCount:1}]) ,updateComp);

// PATCH verify company (admin)
router.put("/:id/verify", verifyComp);

// DELETE company
router.delete("/:id", deleteComp);

export default router;
