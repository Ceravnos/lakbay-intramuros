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

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

export default router;
