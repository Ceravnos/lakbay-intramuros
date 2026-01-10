import express from "express";
import {
    createBooking,
    getPendingBookings,
    getMyAcceptedBookings,
    getBookingHistory,
    acceptBooking,
    completeBooking,
    getMyBookings,
    cancelBooking,
    getBookingStats,
} from "../controllers/bookingController.js";
import { protect, adminOnly, approvedGuideOnly, touristOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Tourist routes
router.post("/", touristOnly, createBooking);
router.get("/my-bookings", touristOnly, getMyBookings);
router.put("/:id/cancel", touristOnly, cancelBooking);

// Guide routes (approved guides only)
router.get("/pending", approvedGuideOnly, getPendingBookings);
router.get("/my-accepted", approvedGuideOnly, getMyAcceptedBookings);
router.get("/history", approvedGuideOnly, getBookingHistory);
router.put("/:id/accept", approvedGuideOnly, acceptBooking);
router.put("/:id/complete", approvedGuideOnly, completeBooking);

// Admin routes
router.get("/stats", adminOnly, getBookingStats);

export default router;
