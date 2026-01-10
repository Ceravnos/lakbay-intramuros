import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Itinerary from "../models/Itinerary.js";

// @desc    Create a new booking request (Tourist only)
// @route   POST /api/bookings
export const createBooking = async (req, res) => {
    try {
        const { itineraryId, preferredDate, numberOfPeople, notes } = req.body;
        const touristId = req.user._id;

        if (!itineraryId || !preferredDate) {
            return res.status(400).json({ message: "Itinerary ID and preferred date are required" });
        }

        // Get itinerary details
        const itinerary = await Itinerary.findById(itineraryId);
        if (!itinerary) {
            return res.status(404).json({ message: "Itinerary not found" });
        }

        // Verify ownership
        if (itinerary.userId.toString() !== touristId.toString()) {
            return res.status(403).json({ message: "You can only book your own itineraries" });
        }

        // Check if tourist already has a pending booking for this itinerary
        const existingBooking = await Booking.findOne({
            touristId,
            itineraryId,
            status: { $in: ["pending", "accepted"] },
        });

        if (existingBooking) {
            return res.status(400).json({ 
                message: "You already have an active booking request for this itinerary" 
            });
        }

        const booking = await Booking.create({
            touristId,
            itineraryId,
            tripDetails: {
                title: itinerary.name,
                preferredDate: new Date(preferredDate),
                numberOfPeople: numberOfPeople || itinerary.numberOfPeople || 1,
                notes: notes || "",
            },
        });

        // Update itinerary status
        itinerary.status = "booked";
        await itinerary.save();

        res.status(201).json({
            message: "Booking request submitted successfully",
            booking,
        });
    } catch (error) {
        console.error("Create booking error:", error);
        res.status(500).json({ message: "Server error creating booking" });
    }
};

// @desc    Get all pending booking requests (Guide only)
// @route   GET /api/bookings/pending
export const getPendingBookings = async (req, res) => {
    try {
        const pendingBookings = await Booking.find({ status: "pending" })
            .populate("touristId", "fullName email")
            .populate("itineraryId")
            .sort({ createdAt: -1 });

        res.json(pendingBookings);
    } catch (error) {
        console.error("Get pending bookings error:", error);
        res.status(500).json({ message: "Server error fetching bookings" });
    }
};

// @desc    Get guide's accepted bookings (Guide only)
// @route   GET /api/bookings/my-accepted
export const getMyAcceptedBookings = async (req, res) => {
    try {
        const guideId = req.user._id;
        
        const acceptedBookings = await Booking.find({ 
            guideId, 
            status: "accepted" 
        })
            .populate("touristId", "fullName email")
            .populate("itineraryId")
            .sort({ acceptedAt: -1 });

        res.json(acceptedBookings);
    } catch (error) {
        console.error("Get accepted bookings error:", error);
        res.status(500).json({ message: "Server error fetching bookings" });
    }
};

// @desc    Get guide's completed bookings history (Guide only)
// @route   GET /api/bookings/history
export const getBookingHistory = async (req, res) => {
    try {
        const guideId = req.user._id;
        
        const completedBookings = await Booking.find({ 
            guideId, 
            status: "completed" 
        })
            .populate("touristId", "fullName email")
            .populate("itineraryId")
            .sort({ completedAt: -1 });

        res.json(completedBookings);
    } catch (error) {
        console.error("Get booking history error:", error);
        res.status(500).json({ message: "Server error fetching history" });
    }
};

// @desc    Accept a booking request (Guide only)
// @route   PUT /api/bookings/:id/accept
export const acceptBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const guideId = req.user._id;

        const booking = await Booking.findById(id);
        
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "pending") {
            return res.status(400).json({ message: "Booking is no longer pending" });
        }

        booking.guideId = guideId;
        booking.status = "accepted";
        booking.acceptedAt = new Date();
        await booking.save();

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email")
            .populate("itineraryId");

        res.json({
            message: "Booking accepted successfully",
            booking: updatedBooking,
        });
    } catch (error) {
        console.error("Accept booking error:", error);
        res.status(500).json({ message: "Server error accepting booking" });
    }
};

// @desc    Mark booking as complete (Guide only)
// @route   PUT /api/bookings/:id/complete
export const completeBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const guideId = req.user._id;

        const booking = await Booking.findById(id);
        
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "accepted") {
            return res.status(400).json({ message: "Only accepted bookings can be completed" });
        }

        if (booking.guideId.toString() !== guideId.toString()) {
            return res.status(403).json({ message: "You can only complete your own bookings" });
        }

        booking.status = "completed";
        booking.completedAt = new Date();
        await booking.save();

        res.json({
            message: "Booking marked as complete",
            booking,
        });
    } catch (error) {
        console.error("Complete booking error:", error);
        res.status(500).json({ message: "Server error completing booking" });
    }
};

// @desc    Get tourist's own bookings
// @route   GET /api/bookings/my-bookings
export const getMyBookings = async (req, res) => {
    try {
        const touristId = req.user._id;
        
        const bookings = await Booking.find({ touristId })
            .populate("guideId", "fullName email contactNumber")
            .populate("itineraryId")
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error("Get my bookings error:", error);
        res.status(500).json({ message: "Server error fetching bookings" });
    }
};

// @desc    Cancel a booking (Tourist only - only pending)
// @route   PUT /api/bookings/:id/cancel
export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const touristId = req.user._id;

        const booking = await Booking.findById(id);
        
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.touristId.toString() !== touristId.toString()) {
            return res.status(403).json({ message: "You can only cancel your own bookings" });
        }

        if (booking.status !== "pending") {
            return res.status(400).json({ message: "Only pending bookings can be cancelled" });
        }

        booking.status = "cancelled";
        await booking.save();

        res.json({
            message: "Booking cancelled successfully",
            booking,
        });
    } catch (error) {
        console.error("Cancel booking error:", error);
        res.status(500).json({ message: "Server error cancelling booking" });
    }
};

// @desc    Get booking stats for admin
// @route   GET /api/bookings/stats
export const getBookingStats = async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const pendingBookings = await Booking.countDocuments({ status: "pending" });
        const acceptedBookings = await Booking.countDocuments({ status: "accepted" });
        const completedBookings = await Booking.countDocuments({ status: "completed" });
        const cancelledBookings = await Booking.countDocuments({ status: "cancelled" });

        res.json({
            totalBookings,
            pendingBookings,
            acceptedBookings,
            completedBookings,
            cancelledBookings,
        });
    } catch (error) {
        console.error("Get booking stats error:", error);
        res.status(500).json({ message: "Server error fetching stats" });
    }
};
