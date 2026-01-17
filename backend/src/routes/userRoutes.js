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

// Get user personalization preferences
router.get("/personalization", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("personalization");
        res.json(user?.personalization || { preferredCategories: [], maxLocationsPerTrip: 5 });
    } catch (error) {
        console.error("Error fetching personalization:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Update user personalization preferences
router.put("/personalization", protect, async (req, res) => {
    try {
        const { preferredCategories, maxLocationsPerTrip } = req.body;
        
        const updateData = {};
        if (preferredCategories !== undefined) {
            updateData["personalization.preferredCategories"] = preferredCategories;
        }
        if (maxLocationsPerTrip !== undefined) {
            updateData["personalization.maxLocationsPerTrip"] = Math.min(10, Math.max(1, maxLocationsPerTrip));
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true }
        ).select("personalization");

        res.json(user.personalization);
    } catch (error) {
        console.error("Error updating personalization:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
