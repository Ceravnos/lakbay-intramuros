import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Get all approved guides (for booking) - includes unavailable dates
router.get("/guides", protect, async (req, res) => {
  try {
    const guides = await User.find({
      role: "guide",
      guideStatus: "approved",
    }).select("fullName email contactNumber totalStars totalRatings unavailableDates profilePicture");

    res.json(guides);
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific guide's details including unavailable dates
router.get("/guides/:guideId", protect, async (req, res) => {
  try {
    const guide = await User.findOne({
      _id: req.params.guideId,
      role: "guide",
      guideStatus: "approved",
    }).select("fullName email contactNumber totalStars totalRatings unavailableDates profilePicture");

    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    res.json(guide);
  } catch (error) {
    console.error("Error fetching guide:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update guide's unavailable dates (for guides only)
router.put("/unavailable-dates", protect, async (req, res) => {
  try {
    const { unavailableDates } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "guide" || user.guideStatus !== "approved") {
      return res.status(403).json({ message: "Only approved guides can set unavailable dates" });
    }

    // Convert string dates to Date objects and filter out past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validDates = unavailableDates
      .map(d => new Date(d))
      .filter(d => d >= today);

    user.unavailableDates = validDates;
    await user.save();

    res.json({ 
      message: "Unavailable dates updated successfully",
      unavailableDates: user.unavailableDates 
    });
  } catch (error) {
    console.error("Error updating unavailable dates:", error);
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

// Update user profile picture
router.put("/profile-picture", protect, async (req, res) => {
  try {
    const { profilePicture } = req.body;
    
    if (!profilePicture) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    // Validate base64 image (basic check)
    if (!profilePicture.startsWith('data:image/')) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture },
      { new: true }
    ).select("profilePicture");

    res.json({ 
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture 
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
