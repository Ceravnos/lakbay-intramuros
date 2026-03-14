import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Itinerary from "../models/Itinerary.js";
import { emitToGuide, emitToUser } from "../config/socket.js";

const GUIDE_DASHBOARD_BOOKING_SELECT = "_id touristId itineraryId status timeSlot tripDetails progress completedAt rejectedAt createdAt startedAt";
const GUIDE_DASHBOARD_POPULATE = [
    { path: "touristId", select: "fullName email phoneNumber" },
    { path: "itineraryId", select: "name locations preferredDate numberOfPeople" },
];
const TOURIST_BOOKING_SELECT = "_id touristId guideId itineraryId status timeSlot tripDetails revisionRequested revisionNote proposedItinerary progress isRated startedAt acceptedAt completedAt rejectedAt createdAt updatedAt";
const TOURIST_BOOKING_POPULATE = [
    { path: "guideId", select: "fullName email phoneNumber profilePicture" },
    { path: "itineraryId", select: "name locations preferredDate numberOfPeople description" },
];
const ITINERARY_CONTEXT_STATUSES = ["pending", "accepted", "awaiting_payment", "paid", "scheduled", "active"];

// @desc    Create a new booking request (Tourist only)
// @route   POST /api/bookings
export const createBooking = async (req, res) => {
    try {
        const { itineraryId, guideId, tripDetails, preferredDate, numberOfPeople, notes, timeSlot } = req.body;
        const touristId = req.user._id;
        const tourist = await User.findById(touristId);

        // Support both old format (preferredDate at root) and new format (tripDetails object)
        const bookingDate = tripDetails?.preferredDate || preferredDate;
        const bookingPeople = tripDetails?.numberOfPeople || numberOfPeople;
        const bookingNotes = tripDetails?.notes || notes;
        const bookingTimeSlot = timeSlot || (tripDetails?.preferredDate ? (new Date(tripDetails.preferredDate).getHours() < 12 ? "AM" : "PM") : "AM");

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

            // Check if guide already has a booking for this date and time slot
            const bookingDateStart = new Date(bookingDate);
            bookingDateStart.setHours(0, 0, 0, 0);
            const bookingDateEnd = new Date(bookingDate);
            bookingDateEnd.setHours(23, 59, 59, 999);

            const existingGuideBooking = await Booking.findOne({
                guideId,
                timeSlot: bookingTimeSlot,
                "tripDetails.preferredDate": { $gte: bookingDateStart, $lte: bookingDateEnd },
                status: { $in: ["pending", "accepted", "awaiting_payment", "scheduled", "active"] },
            });

            if (existingGuideBooking) {
                return res.status(409).json({ 
                    message: `This guide is already booked for the ${bookingTimeSlot === "AM" ? "morning" : "afternoon"} slot on this date` 
                });
            }
        }

        // Check if tourist already has a pending booking for this itinerary
        const existingBooking = await Booking.findOne({
            touristId,
            itineraryId,
            status: { $in: ["pending", "accepted", "awaiting_payment", "paid"] },
        });

        if (existingBooking) {
            return res.status(400).json({ 
                message: "You already have an active booking request for this itinerary" 
            });
        }

        const bookingData = {
            touristId,
            itineraryId,
            timeSlot: bookingTimeSlot,
            tripDetails: {
                title: tripDetails?.title || itinerary.name,
                preferredDate: new Date(bookingDate),
                numberOfPeople: bookingPeople || itinerary.numberOfPeople || 1,
                notes: bookingNotes || "",
                priorityAssistance: tripDetails?.priorityAssistance || [],
                meetingPoint: tripDetails?.meetingPoint || "",
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

        // Emit socket event to notify the guide
        if (guideId) {
            emitToGuide(guideId, "new-booking", booking);
        }

        res.status(201).json({
            message: "Booking request submitted successfully",
            booking,
        });
    } catch (error) {
        console.error("Create booking error:", error);
        res.status(500).json({ message: "Server error creating booking" });
    }
};

// @desc    Get pending booking requests for the logged-in guide only
// @route   GET /api/bookings/pending
export const getPendingBookings = async (req, res) => {
    try {
        const guideId = req.user._id;

        // Only show bookings assigned to this specific guide
        const pendingBookings = await Booking.find({ 
            guideId,
            status: "pending" 
        })
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
            status: { $in: ["accepted", "awaiting_payment", "active"] } 
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

// @desc    Get guide's scheduled bookings (Guide only) - includes awaiting_payment and scheduled
// @route   GET /api/bookings/my-scheduled
export const getMyScheduledBookings = async (req, res) => {
    try {
        const guideId = req.user._id;
        
        const scheduledBookings = await Booking.find({ 
            guideId, 
            status: { $in: ["awaiting_payment", "scheduled"] }
        })
            .populate("touristId", "fullName email phoneNumber")
            .populate("itineraryId")
            .sort({ "tripDetails.preferredDate": 1 }); // Sort by scheduled date ascending

        res.json(scheduledBookings);
        
    } catch (error) {
        console.error("Get scheduled bookings error:", error);
        res.status(500).json({ message: "Server error fetching scheduled bookings" });
    }
};

export const getGuideDashboardData = async (req, res) => {
    try {
        const guideId = req.user._id;

        const dashboardBookings = await Booking.find({
            guideId,
            status: { $in: ["pending", "awaiting_payment", "scheduled", "active", "completed", "rejected"] },
        })
            .select(GUIDE_DASHBOARD_BOOKING_SELECT)
            .populate(GUIDE_DASHBOARD_POPULATE)
            .lean();

        const pendingBookings = [];
        const scheduledBookings = [];
        const activeBookings = [];
        const completedBookings = [];
        const rejectedBookings = [];

        dashboardBookings.forEach((booking) => {
            if (booking.status === "pending") {
                pendingBookings.push(booking);
            } else if (booking.status === "awaiting_payment" || booking.status === "scheduled") {
                scheduledBookings.push(booking);
            } else if (booking.status === "active") {
                activeBookings.push(booking);
            } else if (booking.status === "completed") {
                completedBookings.push(booking);
            } else if (booking.status === "rejected") {
                rejectedBookings.push(booking);
            }
        });

        pendingBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        scheduledBookings.sort((a, b) => new Date(a.tripDetails?.preferredDate) - new Date(b.tripDetails?.preferredDate));
        activeBookings.sort((a, b) => new Date(b.startedAt || b.createdAt) - new Date(a.startedAt || a.createdAt));
        completedBookings.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        rejectedBookings.sort((a, b) => new Date(b.rejectedAt) - new Date(a.rejectedAt));

        res.json({
            pendingBookings,
            scheduledBookings,
            activeBookings,
            completedBookings,
            rejectedBookings,
            unavailableDates: req.user.unavailableDates || [],
        });
    } catch (error) {
        console.error("Get guide dashboard data error:", error);
        res.status(500).json({ message: "Server error fetching guide dashboard data" });
    }
};

// @desc    Start a scheduled trip (Guide only) - For demonstration purposes
// @route   PUT /api/bookings/:id/start
export const startTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const guideId = req.user._id;

        const booking = await Booking.findById(id);
        
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "scheduled") {
            return res.status(400).json({ message: "Only scheduled bookings can be started" });
        }

        if (booking.guideId.toString() !== guideId.toString()) {
            return res.status(403).json({ message: "You can only start your own bookings" });
        }

        const itinerary = await Itinerary.findById(booking.itineraryId).select("locations");
        const totalStops = itinerary?.locations?.length || 0;

        if (totalStops === 0) {
            return res.status(400).json({ message: "This itinerary has no stops to track" });
        }

        booking.status = "active";
        booking.startedAt = new Date();
        booking.progress = {
            completedStopCount: 0,
            totalStops,
            updatedAt: new Date(),
        };
        await booking.save();

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email phoneNumber")
            .populate("itineraryId");

        // Emit socket event to notify the tourist
        emitToUser(booking.touristId.toString(), "booking-started", updatedBooking);

        res.json({
            message: "Trip started successfully",
            booking: updatedBooking,
        });

    } catch (error) {
        console.error("Start trip error:", error);
        res.status(500).json({ message: "Server error starting trip" });
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

        // Verify this booking is assigned to this guide
        if (booking.guideId.toString() !== guideId.toString()) {
            return res.status(403).json({ message: "You can only accept bookings assigned to you" });
        }

        booking.status = "awaiting_payment";
        booking.acceptedAt = new Date();
        await booking.save();

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email phoneNumber")
            .populate("guideId", "fullName profilePicture")
            .populate("itineraryId", "name locations preferredDate numberOfPeople");

        // Emit socket event to notify the tourist
        emitToUser(booking.touristId.toString(), "booking-accepted", updatedBooking);

        res.json({
            message: "Booking accepted successfully",
            booking: updatedBooking,
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

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email phoneNumber")
            .populate("itineraryId");

        // Emit socket event to notify the tourist
        emitToUser(booking.touristId.toString(), "booking-rejected", updatedBooking);

        res.json({
            message: "Booking rejected successfully",
            booking: updatedBooking,
        });

    } catch (error) {
        console.error("Reject booking error:", error);
        res.status(500).json({ message: "Server error rejecting booking" });
    }
}

export const updateTripProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { completedStopCount } = req.body;
        const guideId = req.user._id;

        if (!Number.isInteger(completedStopCount)) {
            return res.status(400).json({ message: "A valid completed stop count is required" });
        }

        const booking = await Booking.findById(id).populate("itineraryId", "locations");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "active") {
            return res.status(400).json({ message: "Only active bookings can update trip progress" });
        }

        if (booking.guideId.toString() !== guideId.toString()) {
            return res.status(403).json({ message: "You can only update your own bookings" });
        }

        const totalStops = booking.itineraryId?.locations?.length || booking.progress?.totalStops || 0;

        if (totalStops === 0) {
            return res.status(400).json({ message: "This itinerary has no stops to track" });
        }

        if (completedStopCount < 0 || completedStopCount > totalStops) {
            return res.status(400).json({ message: "Trip progress is out of range for this itinerary" });
        }

        booking.progress = {
            completedStopCount,
            totalStops,
            updatedAt: new Date(),
        };
        await booking.save();

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email phoneNumber")
            .populate("itineraryId");

        res.json({
            message: "Trip progress updated",
            booking: updatedBooking,
        });
    } catch (error) {
        console.error("Update trip progress error:", error);
        res.status(500).json({ message: "Server error updating trip progress" });
    }
};

// @desc    Mark booking as complete (Guide only)
// @route   PUT /api/bookings/:id/complete
export const completeBooking = async (req, res) => {
    try {
        
        const { id } = req.params;
        const guideId = req.user._id;
        const guide = await User.findById(guideId);

        const booking = await Booking.findById(id).populate("itineraryId", "locations");
        
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "active") {
            return res.status(400).json({ message: "Only active bookings can be completed" });
        }

        if (booking.guideId.toString() !== guideId.toString()) {
            return res.status(403).json({ message: "You can only complete your own bookings" });
        }

        const totalStops = booking.progress?.totalStops || booking.itineraryId?.locations?.length || 0;
        const completedStopCount = Math.min(booking.progress?.completedStopCount || 0, totalStops);

        if (totalStops === 0 || completedStopCount < totalStops) {
            return res.status(400).json({ message: "All itinerary stops must be completed before marking the tour as complete" });
        }

        booking.status = "completed";
        booking.completedAt = new Date();
        await booking.save();
        await booking.populate("guideId", "fullName profilePicture");

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email phoneNumber")
            .populate("guideId", "fullName profilePicture")
            .populate("itineraryId", "name locations preferredDate numberOfPeople");

        // Emit socket event to notify the tourist
        emitToUser(booking.touristId.toString(), "booking-completed", updatedBooking);

        res.json({
            message: "Booking marked as complete",
            booking: updatedBooking,
        });

    } catch (error) {
        console.error("Complete booking error:", error);
        res.status(500).json({ message: "Server error completing booking" });
    }
};

export const getItineraryBookingContext = async (req, res) => {
    try {
        const touristId = req.user._id;
        const { itineraryId } = req.params;

        const booking = await Booking.findOne({
            touristId,
            itineraryId,
            status: { $in: ITINERARY_CONTEXT_STATUSES },
        })
            .select(TOURIST_BOOKING_SELECT)
            .populate(TOURIST_BOOKING_POPULATE)
            .sort({ createdAt: -1 })
            .lean();

        res.json({ booking });
    } catch (error) {
        console.error("Get itinerary booking context error:", error);
        res.status(500).json({ message: "Server error fetching itinerary booking context" });
    }
};

// @desc    Get tourist's own bookings
// @route   GET /api/bookings/my-bookings
export const getMyBookings = async (req, res) => {
    try {
        const touristId = req.user._id;
        
        const bookings = await Booking.find({ touristId })
            .select(TOURIST_BOOKING_SELECT)
            .populate(TOURIST_BOOKING_POPULATE)
            .sort({ createdAt: -1 })
            .lean();

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

        if (!["pending", "awaiting_payment"].includes(booking.status)) {
            return res.status(400).json({ message: "Only pending or awaiting payment bookings can be cancelled" });
        }

        booking.status = "cancelled";
        booking.revisionRequested = false;
        booking.revisionNote = "";
        booking.proposedItinerary = undefined;
        await booking.save();

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email phoneNumber")
            .populate("guideId", "fullName email profilePicture")
            .populate("itineraryId", "name locations preferredDate numberOfPeople");

        if (booking.guideId) {
            emitToGuide(booking.guideId.toString(), "booking-cancelled", updatedBooking);
        }

        res.json({
            message: "Booking cancelled successfully",
            booking: updatedBooking,
        });
    } catch (error) {
        console.error("Cancel booking error:", error);
        res.status(500).json({ message: "Server error cancelling booking" });
    }
};

export const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const touristId = req.user._id;

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.touristId.toString() !== touristId.toString()) {
            return res.status(403).json({ message: "You can only delete your own bookings" });
        }

        if (!["completed", "rejected", "cancelled"].includes(booking.status)) {
            return res.status(400).json({ message: "Only completed, rejected, or cancelled bookings can be deleted" });
        }

        const itineraryId = booking.itineraryId;

        await Payment.deleteMany({ bookingId: booking._id });
        await Booking.findByIdAndDelete(id);

        if (itineraryId) {
            const remainingBookings = await Booking.countDocuments({ touristId, itineraryId });

            if (remainingBookings === 0) {
                const itinerary = await Itinerary.findById(itineraryId);

                if (itinerary && itinerary.userId.toString() === touristId.toString()) {
                    itinerary.status = itinerary.locations?.length > 0 || itinerary.preferredDate ? "planned" : "draft";
                    await itinerary.save();
                }
            }
        }

        res.json({ message: "Booking deleted successfully" });
    } catch (error) {
        console.error("Delete booking error:", error);
        res.status(500).json({ message: "Server error deleting booking" });
    }
};

// @desc    Request revision from tourist (Guide only) - Guide proposes itinerary changes
// @route   PUT /api/bookings/:id/revision
export const requestRevision = async (req, res) => {
    try {
        const { id } = req.params;
        const { note, proposedItinerary } = req.body;
        const guideId = req.user._id;

        const booking = await Booking.findById(id);
        
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "pending") {
            return res.status(400).json({ message: "Can only request revision for pending bookings" });
        }

        if (booking.guideId.toString() !== guideId.toString()) {
            return res.status(403).json({ message: "You can only request revision for your own bookings" });
        }

        booking.revisionRequested = true;
        booking.revisionNote = note || "";
        
        // Store the guide's proposed itinerary changes
        if (proposedItinerary) {
            booking.proposedItinerary = {
                locations: proposedItinerary.locations || [],
                preferredDate: proposedItinerary.preferredDate ? new Date(proposedItinerary.preferredDate) : null,
                numberOfPeople: proposedItinerary.numberOfPeople || null,
            };
        }
        
        await booking.save();

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email phoneNumber")
            .populate("guideId", "fullName profilePicture")
            .populate("itineraryId");

        // Emit socket event to notify the tourist
        emitToUser(booking.touristId.toString(), "revision-requested", updatedBooking);

        res.json({
            message: "Revision request sent to tourist",
            booking: updatedBooking,
        });
    } catch (error) {
        console.error("Request revision error:", error);
        res.status(500).json({ message: "Server error requesting revision" });
    }
};

// @desc    Update booking after revision request (Tourist only)
// @route   PUT /api/bookings/:id/update-revision
export const updateBookingRevision = async (req, res) => {
    try {
        const { id } = req.params;
        const { tripDetails } = req.body;
        const touristId = req.user._id;

        const booking = await Booking.findById(id);
        
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.touristId.toString() !== touristId.toString()) {
            return res.status(403).json({ message: "You can only update your own bookings" });
        }

        if (booking.status !== "pending") {
            return res.status(400).json({ message: "Only pending bookings can be updated" });
        }

        // Update trip details
        if (tripDetails) {
            booking.tripDetails = {
                ...booking.tripDetails,
                title: tripDetails.title || booking.tripDetails.title,
                preferredDate: tripDetails.preferredDate ? new Date(tripDetails.preferredDate) : booking.tripDetails.preferredDate,
                numberOfPeople: tripDetails.numberOfPeople || booking.tripDetails.numberOfPeople,
                notes: tripDetails.notes !== undefined ? tripDetails.notes : booking.tripDetails.notes,
                priorityAssistance: tripDetails.priorityAssistance || booking.tripDetails.priorityAssistance,
                meetingPoint: tripDetails.meetingPoint || booking.tripDetails.meetingPoint,
            };
        }

        // Clear revision request flag
        booking.revisionRequested = false;
        booking.revisionNote = "";
        
        await booking.save();

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email phoneNumber")
            .populate("guideId", "fullName profilePicture")
            .populate("itineraryId");

        // Emit socket event to notify the guide
        if (booking.guideId) {
            emitToGuide(booking.guideId.toString(), "booking-updated", updatedBooking);
        }

        res.json({
            message: "Booking updated successfully",
            booking: updatedBooking,
        });
    } catch (error) {
        console.error("Update booking revision error:", error);
        res.status(500).json({ message: "Server error updating booking" });
    }
};

// @desc    Accept guide's proposed revision (Tourist only)
// @route   PUT /api/bookings/:id/accept-revision
export const acceptRevision = async (req, res) => {
    try {
        const { id } = req.params;
        const touristId = req.user._id;

        const booking = await Booking.findById(id).populate("itineraryId");
        
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.touristId.toString() !== touristId.toString()) {
            return res.status(403).json({ message: "You can only accept revisions for your own bookings" });
        }

        if (!booking.revisionRequested || !booking.proposedItinerary) {
            return res.status(400).json({ message: "No revision to accept" });
        }

        // Update the actual itinerary with the proposed changes
        const Itinerary = (await import("../models/Itinerary.js")).default;
        const itinerary = await Itinerary.findById(booking.itineraryId._id || booking.itineraryId);
        
        if (!itinerary) {
            return res.status(404).json({ message: "Itinerary not found" });
        }

        // Apply proposed changes to itinerary
        if (booking.proposedItinerary.locations?.length > 0) {
            itinerary.locations = booking.proposedItinerary.locations;
        }
        if (booking.proposedItinerary.preferredDate) {
            itinerary.preferredDate = booking.proposedItinerary.preferredDate;
            booking.tripDetails.preferredDate = booking.proposedItinerary.preferredDate;
        }
        if (booking.proposedItinerary.numberOfPeople) {
            itinerary.numberOfPeople = booking.proposedItinerary.numberOfPeople;
            booking.tripDetails.numberOfPeople = booking.proposedItinerary.numberOfPeople;
        }

        await itinerary.save();

        // Clear revision request
        booking.status = "awaiting_payment";
        booking.acceptedAt = booking.acceptedAt || new Date();
        booking.revisionRequested = false;
        booking.revisionNote = "";
        booking.proposedItinerary = undefined;
        
        await booking.save();

        const updatedBooking = await Booking.findById(id)
            .populate("touristId", "fullName email phoneNumber")
            .populate("guideId", "fullName profilePicture")
            .populate("itineraryId");

        // Emit socket event to notify the guide
        if (booking.guideId) {
            emitToGuide(booking.guideId.toString(), "revision-accepted", updatedBooking);
        }

        res.json({
            message: "Revision accepted successfully",
            booking: updatedBooking,
        });
    } catch (error) {
        console.error("Accept revision error:", error);
        res.status(500).json({ message: "Server error accepting revision" });
    }
};

// @desc    Get booking stats for admin
// @route   GET /api/bookings/stats
export const getBookingStats = async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const pendingBookings = await Booking.countDocuments({ status: "pending" });
        const acceptedBookings = await Booking.countDocuments({ status: "accepted" });
        const awaitingPaymentBookings = await Booking.countDocuments({ status: "awaiting_payment" });
        const paidBookings = await Booking.countDocuments({ status: "paid" });
        const completedBookings = await Booking.countDocuments({ status: "completed" });
        const cancelledBookings = await Booking.countDocuments({ status: "cancelled" });

        res.json({
            totalBookings,
            pendingBookings,
            acceptedBookings,
            awaitingPaymentBookings,
            paidBookings,
            completedBookings,
            cancelledBookings,
        });
    } catch (error) {
        console.error("Get booking stats error:", error);
        res.status(500).json({ message: "Server error fetching stats" });
    }
};


