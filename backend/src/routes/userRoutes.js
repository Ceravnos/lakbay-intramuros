import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Get all approved guides (for booking)
router.get("/guides", protect, async (req, res) => {
    try {
        const guides = await User.find({
            role: "guide",
            guideStatus: "approved",
        }).select("fullName email contactNumber");

        res.json(guides);
    } catch (error) {
        console.error("Error fetching guides:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
