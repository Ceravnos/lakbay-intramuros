import express from "express";
import {
    getPendingGuides,
    getAllGuides,
    getActiveGuides,
    getGuideById,
    approveGuide,
    rejectGuide,
    requestDocuments,
    getDashboardStats,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
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
router.put("/request-documents/:id", requestDocuments);
router.get("/active-guides", getActiveGuides);

// User management
router.get("/users", getAllUsers);
router.get("/user/:id", getUserById);
router.put("/user/:id", updateUser);
router.delete("/user/:id", deleteUser);

export default router;
