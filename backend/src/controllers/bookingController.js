import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Itinerary from "../models/Itinerary.js";
import { setGuideActivityStatus } from "../utils/guideActivity.js";
import { io } from "../app.js";

// @desc    Create a new booking request (Tourist only)
// @route   POST /api/bookings
export const createBooking = async (req, res) => {
    try {
        const { itineraryId, guideId, tripDetails, preferredDate, numberOfPeople, notes } = req.body;
        const touristId = req.user._id;
        const tourist = await User.findById(touristId);

        // Support both old format (preferredDate at root) and new format (tripDetails object)
        const bookingDate = tripDetails?.preferredDate || preferredDate;
        const bookingPeople = tripDetails?.numberOfPeople || numberOfPeople;
        const bookingNotes = tripDetails?.notes || notes;

        if (!itineraryId || !bookingDate) {
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

        // If guideId is provided, verify the guide exists and is approved
        if (guideId) {
            const guide = await User.findById(guideId);
            if (!guide) {
                return res.status(404).json({ message: "Selected guide not found" });
            }
            if (guide.role !== "guide" || guide.guideStatus !== "approved") {
                return res.status(400).json({ message: "Selected user is not an approved guide" });
            }

            if (guide.activityStatus !== "active") {
                return res.status(409).json({
                    message: "Guide is no longer active. Please select another guide.",
                });
            }
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

        const bookingData = {
            touristId,
            itineraryId,
            tripDetails: {
                title: tripDetails?.title || itinerary.name,
                preferredDate: new Date(bookingDate),
                numberOfPeople: bookingPeople || itinerary.numberOfPeople || 1,
                notes: bookingNotes || "",
            },
        };

        // If a specific guide was selected, assign them directly
        if (guideId) {
            bookingData.guideId = guideId;
        }

        const booking = await Booking.create(bookingData);

        // Update itinerary status
        itinerary.status = "booked";
        await itinerary.save();

         // 🔔 NOTIFY THE GUIDE
        io.to(guideId.toString()).emit("booking:requested", {
            bookingId: booking._id,
            message: `New booking request from ${tourist.fullName}`,
        });

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
            .populate("touristId", "fullName email phoneNumber")
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
            .populate("touristId", "fullName email phoneNumber")
            .populate("itineraryId")
            .sort({ acceptedAt: -1 });

        res.json(acceptedBookings);
        
    } catch (error) {
        console.error("Get accepted bookings error:", error);
        res.status(500).json({ message: "Server error fetching bookings" });
    }
};

// @desc    Get guide's rejected bookings (Guide only)
// @route   GET /api/bookings/my-rejected
export const getMyRejectedBookings = async (req, res) => {
    try {
        

        const guideId = req.user._id;
        
        const rejectedBookings = await Booking.find({ 
            guideId, 
            status: "rejected" 
        })
            .populate("touristId", "fullName email")
            .populate("itineraryId")
            .sort({ rejectedAt: -1 });

        res.json(rejectedBookings);
        
    } catch (error) {
        console.error("Get rejected bookings error:", error);
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
            status: "completed" || "rejected"
        })
            .populate("touristId", "fullName email")
            .populate("itineraryId")
            .sort({ completedAt: -1 });

        res.json({completedBookings});

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
        const guide = await User.findById(guideId);

        const booking = await Booking.findById(id);
        
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "pending") {
            return res.status(400).json({ message: "Booking is no longer pending" });
        }

        if (guide.activityStatus !== "active") {
            return res.status(403).json({
                message: "You must be active to accept a booking"
            });
        }

        booking.guideId = guideId;
        booking.status = "accepted";
        booking.acceptedAt = new Date();
        await booking.save();

        await setGuideActivityStatus(guide, "working");

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email")
            .populate("itineraryId");

        // 🔔 Emit to the tourist's room
        io.to(booking.touristId.toString()).emit("booking:accepted", {
            bookingId: booking._id,
            message: `Your booking "${booking.tripDetails?.title}" has been accepted by the guide!`,
        });

        res.json({
            message: "Booking accepted successfully",
            booking: updatedBooking,
            activityStatus: guide.activityStatus,
        });


    } catch (error) {
        console.error("Accept booking error:", error);
        res.status(500).json({ message: "Server error accepting booking" });
    }
};

export const rejectBooking = async (req, res) => {
    try {
        
        const { id } = req.params;
        const guideId = req.user._id;
        const guide = await User.findById(guideId);

        const booking = await Booking.findById(id);
        
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "pending") {
            return res.status(400).json({ message: "Booking is no longer pending" });
        }

        if (booking.guideId.toString() !== guideId.toString()) {
            return res.status(403).json({ message: "You can only reject your own bookings" });
        }

        booking.status = "rejected";
        booking.rejectedAt = new Date();
        await booking.save();

        await setGuideActivityStatus(guide, "active");

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email")
            .populate("itineraryId");

        // emit to the tourist
        io.to(booking.touristId.toString()).emit("booking:rejected", {
            bookingId: booking._id,
            message: "Your booking was rejected by the guide",
        });

        res.json({
            message: "Booking rejected successfully",
            booking: updatedBooking,
            activityStatus: guide.activityStatus,
        });
        
    } catch (error) {
        console.error("Reject booking error:", error);
        res.status(500).json({ message: "Server error rejecting booking" });
    }
}

// @desc    Mark booking as complete (Guide only)
// @route   PUT /api/bookings/:id/complete
export const completeBooking = async (req, res) => {
    try {
        
        const { id } = req.params;
        const guideId = req.user._id;
        const guide = await User.findById(guideId);

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
        await booking.populate("guideId", "fullName");

        await setGuideActivityStatus(guide, "active");

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email")
            .populate("itineraryId");

        
        io.to(booking.touristId.toString()).emit("booking:completed", {
            message: "Your booking has been completed by the guide",
            booking
        });

        res.json({
            message: "Booking marked as complete",
            booking,
            activityStatus: guide.activityStatus,
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
            .populate("guideId", "fullName email")
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


