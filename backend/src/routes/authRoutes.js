import express from "express";
import {
    register,
    login,
    loginAdmin,
    applyForGuide,
    toggleGuideMode,
    toggleActivityStatus,
    getMe,
    forgotPassword,
    verifyOtp,
    resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { updateLastActivity } from "../middleware/updateLastActivity.js";

const router = express.Router();

// Unified auth routes
router.post("/register", register);
router.post("/login", login);

// Admin route
router.post("/admin-login", loginAdmin);

// Protected routes
router.get("/me", protect, getMe);
router.post("/apply-guide", protect, applyForGuide);
router.put("/toggle-guide-mode", protect, toggleGuideMode);
router.put("/toggle-activity-status", protect, toggleActivityStatus);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

// --- PROTECTED ROUTES ---
router.use(protect); // from here on, user must be logged in
router.use(updateLastActivity);

// --- ROUTES AFTER PROTECTED + AUTOLOGOUT ---
router.get("/me", getMe);
router.post("/apply-guide", applyForGuide);
router.put("/toggle-guide-mode", toggleGuideMode);
router.put("/toggle-activity-status", toggleActivityStatus);


export default router;
