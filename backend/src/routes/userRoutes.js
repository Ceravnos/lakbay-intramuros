import express from "express";
import axios from "axios";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

const router = express.Router();
const PSGC_API_BASE = "https://psgc.gitlab.io/api";

const mapPsgcOptions = (items = []) => (
  items
    .map((item) => ({
      code: item.code,
      name: item.name,
    }))
    .sort((leftItem, rightItem) => leftItem.name.localeCompare(rightItem.name))
);

const fetchPsgcOptions = async (path) => {
  const response = await axios.get(`${PSGC_API_BASE}${path}`);
  return mapPsgcOptions(Array.isArray(response.data) ? response.data : []);
};

// Get all approved guides (for booking) - includes unavailable dates and slot availability
router.get("/guides", protect, async (req, res) => {
  try {
    const { date } = req.query;
    
    const guides = await User.find({
      role: "guide",
      guideStatus: "approved",
      _id: { $ne: req.user._id },
    })
      .select("fullName email contactNumber totalStars totalRatings unavailableDates profilePicture")
      .lean();

    // If a date is provided, check slot availability for each guide
    if (date) {
      const queryDate = new Date(date);
      const dateStart = new Date(queryDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(queryDate);
      dateEnd.setHours(23, 59, 59, 999);

      // Get all active bookings for this date
      const bookingsOnDate = await Booking.find({
        guideId: { $ne: null },
        "tripDetails.preferredDate": { $gte: dateStart, $lte: dateEnd },
        status: { $in: ["pending", "accepted", "awaiting_payment", "scheduled", "active"] },
      })
        .select("guideId timeSlot")
        .lean();

      // Create a map of guide bookings
      const guideBookings = {};
      bookingsOnDate.forEach(booking => {
        if (booking.guideId) {
          const guideIdStr = booking.guideId.toString();
          if (!guideBookings[guideIdStr]) {
            guideBookings[guideIdStr] = { AM: false, PM: false };
          }
          guideBookings[guideIdStr][booking.timeSlot] = true;
        }
      });

      // Add slot availability to each guide
      const guidesWithAvailability = guides.map(guide => {
        const guideIdStr = guide._id.toString();
        const slots = guideBookings[guideIdStr] || { AM: false, PM: false };
        
        return {
          ...guide,
          bookedSlots: {
            AM: slots.AM,
            PM: slots.PM,
          },
          fullyBooked: slots.AM && slots.PM,
        };
      });

      // Filter out fully booked guides
      const availableGuides = guidesWithAvailability.filter(g => !g.fullyBooked);
      return res.json(availableGuides);
    }

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

router.get("/psgc/regions", protect, async (req, res) => {
  try {
    const regions = await fetchPsgcOptions("/regions/");
    res.json(regions);
  } catch (error) {
    console.error("Error fetching PSGC regions:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to load PSGC regions" });
  }
});

router.get("/psgc/provinces", protect, async (req, res) => {
  try {
    const { regionCode } = req.query;

    if (!regionCode) {
      return res.status(400).json({ message: "regionCode is required" });
    }

    const provinces = await fetchPsgcOptions(`/regions/${regionCode}/provinces/`);
    res.json(provinces);
  } catch (error) {
    console.error("Error fetching PSGC provinces:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to load PSGC provinces" });
  }
});

router.get("/psgc/cities-municipalities", protect, async (req, res) => {
  try {
    const { regionCode, provinceCode } = req.query;

    if (!regionCode && !provinceCode) {
      return res.status(400).json({ message: "regionCode or provinceCode is required" });
    }

    const endpointPath = provinceCode
      ? `/provinces/${provinceCode}/cities-municipalities/`
      : `/regions/${regionCode}/cities-municipalities/`;
    const citiesMunicipalities = await fetchPsgcOptions(endpointPath);
    res.json(citiesMunicipalities);
  } catch (error) {
    console.error("Error fetching PSGC cities/municipalities:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to load PSGC cities and municipalities" });
  }
});

router.get("/psgc/barangays", protect, async (req, res) => {
  try {
    const { cityMunicipalityCode } = req.query;

    if (!cityMunicipalityCode) {
      return res.status(400).json({ message: "cityMunicipalityCode is required" });
    }

    const barangays = await fetchPsgcOptions(`/cities-municipalities/${cityMunicipalityCode}/barangays/`);
    res.json(barangays);
  } catch (error) {
    console.error("Error fetching PSGC barangays:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to load PSGC barangays" });
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
