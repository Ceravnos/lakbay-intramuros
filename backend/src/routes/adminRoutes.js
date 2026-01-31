import express from "express";
import {
    getPendingGuides,
    getAllGuides,
    getActiveGuides,
    getGuideById,
    approveGuide,
    rejectGuide,
    getDashboardStats,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Dashboard stats
router.get("/stats", getDashboardStats);

// Tour guide management
router.get("/pending-guides", getPendingGuides);
router.get("/guides", getAllGuides);
router.get("/guide/:id", getGuideById);
router.put("/approve-guide/:id", approveGuide);
router.put("/reject-guide/:id", rejectGuide);
router.get("/active-guides", getActiveGuides);

export default router;
