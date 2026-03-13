import express from "express";
import {
    createBooking,
    getPendingBookings,
    getMyAcceptedBookings,
    getMyScheduledBookings,
    getGuideDashboardData,
    getMyRejectedBookings,
    getBookingHistory,
    acceptBooking,
    rejectBooking,
    completeBooking,
    startTrip,
    getMyBookings,
    cancelBooking,
    getBookingStats,
    requestRevision,
    updateBookingRevision,
    acceptRevision,
} from "../controllers/bookingController.js";
import { protect, adminOnly, approvedGuideOnly, touristOnly } from "../middleware/authMiddleware.js";
import { updateLastActivity } from "../middleware/updateLastActivity.js";

const router = express.Router();

// All routes require authentication
router.use(protect);
router.use(updateLastActivity);
// Tourist routes
router.post("/", touristOnly, createBooking);
router.get("/my-bookings", touristOnly, getMyBookings);
router.put("/:id/cancel", touristOnly, cancelBooking);
router.put("/:id/update-revision", touristOnly, updateBookingRevision);
router.put("/:id/accept-revision", touristOnly, acceptRevision);

// Guide routes (approved guides only)
router.get("/guide-dashboard", approvedGuideOnly, getGuideDashboardData);
router.get("/pending", approvedGuideOnly, getPendingBookings);
router.get("/my-accepted", approvedGuideOnly, getMyAcceptedBookings);
router.get("/my-scheduled", approvedGuideOnly, getMyScheduledBookings);
router.get("/history", approvedGuideOnly, getBookingHistory);
router.get("/my-rejected", approvedGuideOnly, getMyRejectedBookings);

router.put("/:id/accept", approvedGuideOnly, acceptBooking);
router.put("/:id/reject", approvedGuideOnly, rejectBooking);
router.put("/:id/revision", approvedGuideOnly, requestRevision);
router.put("/:id/start", approvedGuideOnly, startTrip);

router.put("/:id/complete", approvedGuideOnly, completeBooking);

// Admin routes
router.get("/stats", adminOnly, getBookingStats);

export default router;
