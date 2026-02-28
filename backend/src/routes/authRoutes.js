import express from "express";
import {
    register,
    login,
    loginAdmin,
    applyForGuide,
    toggleGuideMode,
    getMe,
    forgotPassword,
    verifyOtp,
    resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { updateLastActivity } from "../middleware/updateLastActivity.js";

const router = express.Router();

// Public auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", loginAdmin);

// Password reset routes (public)
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

// Protected routes - require authentication
router.get("/me", protect, updateLastActivity, getMe);
router.post("/apply-guide", protect, updateLastActivity, applyForGuide);
router.put("/toggle-guide-mode", protect, updateLastActivity, toggleGuideMode);

export default router;
