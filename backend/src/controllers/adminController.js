import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";

const parseIntegerFilter = (value) => {
    if (value === undefined || value === null || value === "" || value === "all") {
        return null;
    }

    const parsedValue = Number.parseInt(value, 10);
    return Number.isInteger(parsedValue) ? parsedValue : null;
};

const buildDateFilter = (month, year) => {
    if (!month && !year) {
        return null;
    }

    const resolvedYear = year || new Date().getFullYear();
    const startDate = month
        ? new Date(resolvedYear, month - 1, 1)
        : new Date(resolvedYear, 0, 1);
    const endDate = month
        ? new Date(resolvedYear, month, 1)
        : new Date(resolvedYear + 1, 0, 1);

    return {
        startDate,
        endDate,
        resolvedYear,
    };
};

const buildRouteSummary = (locations = [], fallbackTitle = "") => {
    const stopNames = locations
        .map((location) => location?.name)
        .filter(Boolean);

    if (!stopNames.length) {
        return fallbackTitle || "N/A";
    }

    const visibleStops = stopNames.slice(0, 3).join(", ");
    return stopNames.length > 3
        ? `${visibleStops} +${stopNames.length - 3} more`
        : visibleStops;
};

// @desc    Get all pending guide applications (includes documents_requested)
// @route   GET /api/admin/pending-guides
export const getPendingGuides = async (req, res) => {
    try {
        const pendingGuides = await User.find({ 
            guideStatus: { $in: ["pending", "documents_requested"] }
        })
            .select("-password")
            .sort({ createdAt: -1 });

        // Map to include status field for frontend compatibility
        const mappedGuides = pendingGuides.map(guide => ({
            ...guide.toObject(),
            status: guide.guideStatus,
            accreditationFile: guide.accreditationUrl,
        }));

        res.json(mappedGuides);
    } catch (error) {
        console.error("Get pending guides error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get all users with guide applications (all statuses)
// @route   GET /api/admin/guides
export const getAllGuides = async (req, res) => {
    try {
        const guides = await User.find({ 
            guideStatus: { $in: ["pending", "approved", "rejected", "documents_requested"] }
        })
            .select("-password")
            .sort({ createdAt: -1 });

        // Map to include status field for frontend compatibility
        const mappedGuides = guides.map(guide => ({
            ...guide.toObject(),
            status: guide.guideStatus,
            accreditationFile: guide.accreditationUrl,
        }));

        res.json(mappedGuides);
    } catch (error) {
        console.error("Get all guides error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get all active guides
// @route   GET /api/admin/active-guides
export const getActiveGuides = async (req, res) => {
    try {
        const activeGuides = await User.find({ guideStatus: "approved" })
            .select("-password")
            .sort({ createdAt: -1 });

        // Map to include status field for frontend compatibility
        const mappedGuides = activeGuides.map(guide => ({
            ...guide.toObject(),
            status: guide.guideStatus,
            accreditationFile: guide.accreditationUrl,
        }));

        res.json(mappedGuides);
    } catch (error) {
        console.error("Get active guides error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get single guide application details
// @route   GET /api/admin/guide/:id
export const getGuideById = async (req, res) => {
    try {
        const guide = await User.findById(req.params.id).select("-password");

        if (!guide) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            ...guide.toObject(),
            status: guide.guideStatus,
            accreditationFile: guide.accreditationUrl,
        });
    } catch (error) {
        console.error("Get guide by id error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Approve a guide application
// @route   PUT /api/admin/approve-guide/:id
export const approveGuide = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.guideStatus === "approved") {
            return res.status(400).json({ message: "User is already an approved guide" });
        }

        user.guideStatus = "approved";
        user.role = "guide";
        user.livenessCheckStatus = user.livenessSelfieUrl ? "verified" : user.livenessCheckStatus;
        user.livenessRejectionReason = null;
        user.rejectionReason = null;
        await user.save();

        res.json({ 
            message: "Guide application approved successfully",
            guide: {
                _id: user._id,
                email: user.email,
                fullName: user.fullName,
                status: user.guideStatus,
                role: user.role,
            }
        });
    } catch (error) {
        console.error("Approve guide error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Reject a guide application
// @route   PUT /api/admin/reject-guide/:id
export const rejectGuide = async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.guideStatus = "rejected";
        user.rejectionReason = reason || "Application did not meet requirements";
        user.livenessCheckStatus = user.livenessSelfieUrl ? "rejected" : user.livenessCheckStatus;
        user.livenessRejectionReason = user.livenessSelfieUrl ? (reason || "Liveness or verification review failed") : user.livenessRejectionReason;
        await user.save();

        res.json({ 
            message: "Guide application rejected",
            guide: {
                _id: user._id,
                email: user.email,
                fullName: user.fullName,
                status: user.guideStatus,
                rejectionReason: user.rejectionReason,
            }
        });
    } catch (error) {
        console.error("Reject guide error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Request updated documents from guide
// @route   PUT /api/admin/request-documents/:id
export const requestDocuments = async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.guideStatus !== "pending") {
            return res.status(400).json({ message: "Can only request documents for pending applications" });
        }

        user.guideStatus = "documents_requested";
        user.documentRequestReason = reason || "Please upload updated or clearer documents for verification.";
        user.livenessCheckStatus = user.livenessSelfieUrl ? "pending" : user.livenessCheckStatus;
        user.livenessRejectionReason = null;
        await user.save();

        res.json({ 
            message: "Document request sent to guide",
            guide: {
                _id: user._id,
                email: user.email,
                fullName: user.fullName,
                status: user.guideStatus,
                documentRequestReason: user.documentRequestReason,
            }
        });
    } catch (error) {
        console.error("Request documents error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
export const getDashboardStats = async (req, res) => {
    try {
        const totalGuides = await User.countDocuments({ 
            guideStatus: { $in: ["pending", "approved", "rejected"] }
        });
        const pendingGuides = await User.countDocuments({ guideStatus: "pending" });
        const approvedGuides = await User.countDocuments({ guideStatus: "approved" });
        const rejectedGuides = await User.countDocuments({ guideStatus: "rejected" });
        const activeGuides = await User.countDocuments({ activityStatus: "active" });

        res.json({
            totalGuides,
            pendingGuides,
            approvedGuides,
            rejectedGuides,
            activeGuides,
        });
    } catch (error) {
        console.error("Get dashboard stats error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getBookingReports = async (req, res) => {
    try {
        const month = parseIntegerFilter(req.query.month);
        const year = parseIntegerFilter(req.query.year);

        if (req.query.month && (!month || month < 1 || month > 12)) {
            return res.status(400).json({ message: "Month filter must be between 1 and 12" });
        }

        if (req.query.year && !year) {
            return res.status(400).json({ message: "Year filter is invalid" });
        }

        const dateFilter = buildDateFilter(month, year);
        const bookingQuery = {};

        if (dateFilter) {
            bookingQuery["tripDetails.preferredDate"] = {
                $gte: dateFilter.startDate,
                $lt: dateFilter.endDate,
            };
        }

        const bookings = await Booking.find(bookingQuery)
            .select("_id touristId guideId itineraryId status timeSlot tripDetails acceptedAt scheduledAt startedAt completedAt rejectedAt createdAt")
            .populate("touristId", "fullName email")
            .populate("guideId", "fullName email")
            .populate("itineraryId", "name locations")
            .sort({ "tripDetails.preferredDate": -1, createdAt: -1 })
            .lean();

        const bookingIds = bookings.map((booking) => booking._id);
        const payments = bookingIds.length > 0
            ? await Payment.find({ bookingId: { $in: bookingIds } })
                .select("bookingId amount currency status paidAt createdAt")
                .sort({ createdAt: -1 })
                .lean()
            : [];

        const latestPaymentByBookingId = new Map();

        payments.forEach((payment) => {
            const bookingId = payment.bookingId?.toString();

            if (bookingId && !latestPaymentByBookingId.has(bookingId)) {
                latestPaymentByBookingId.set(bookingId, payment);
            }
        });

        const reports = bookings.map((booking) => {
            const payment = latestPaymentByBookingId.get(booking._id.toString()) || null;
            const itineraryLocations = Array.isArray(booking.itineraryId?.locations)
                ? booking.itineraryId.locations
                : [];

            return {
                _id: booking._id,
                title: booking.tripDetails?.title || booking.itineraryId?.name || "Untitled Tour",
                tourist: {
                    fullName: booking.touristId?.fullName || "Unknown Tourist",
                    email: booking.touristId?.email || "",
                },
                guide: booking.guideId
                    ? {
                        fullName: booking.guideId?.fullName || "Unknown Guide",
                        email: booking.guideId?.email || "",
                    }
                    : null,
                routeSummary: buildRouteSummary(itineraryLocations, booking.tripDetails?.title || booking.itineraryId?.name || ""),
                meetingPoint: booking.tripDetails?.meetingPoint || "",
                preferredDate: booking.tripDetails?.preferredDate || null,
                timeSlot: booking.timeSlot,
                numberOfPeople: booking.tripDetails?.numberOfPeople || 0,
                status: booking.status,
                payment: payment
                    ? {
                        amount: payment.amount || 0,
                        currency: payment.currency || "PHP",
                        status: payment.status,
                        paidAt: payment.paidAt || null,
                    }
                    : null,
                acceptedAt: booking.acceptedAt || null,
                scheduledAt: booking.scheduledAt || null,
                startedAt: booking.startedAt || null,
                completedAt: booking.completedAt || null,
                rejectedAt: booking.rejectedAt || null,
                createdAt: booking.createdAt,
            };
        });

        const summary = reports.reduce(
            (accumulator, report) => {
                accumulator.totalBookings += 1;
                accumulator.totalParticipants += report.numberOfPeople || 0;

                if (report.status === "pending") accumulator.pendingBookings += 1;
                if (report.status === "accepted") accumulator.acceptedBookings += 1;
                if (report.status === "awaiting_payment") accumulator.awaitingPaymentBookings += 1;
                if (report.status === "scheduled") accumulator.scheduledBookings += 1;
                if (report.status === "active") accumulator.activeBookings += 1;
                if (report.status === "completed") accumulator.completedBookings += 1;
                if (report.status === "rejected") accumulator.rejectedBookings += 1;
                if (report.status === "cancelled") accumulator.cancelledBookings += 1;

                if (report.payment?.status === "paid") {
                    accumulator.paidBookings += 1;
                    accumulator.totalPaidAmount += report.payment.amount || 0;
                }

                return accumulator;
            },
            {
                totalBookings: 0,
                totalParticipants: 0,
                pendingBookings: 0,
                acceptedBookings: 0,
                awaitingPaymentBookings: 0,
                scheduledBookings: 0,
                activeBookings: 0,
                completedBookings: 0,
                rejectedBookings: 0,
                cancelledBookings: 0,
                paidBookings: 0,
                totalPaidAmount: 0,
            }
        );

        const availableYearsRaw = await Booking.aggregate([
            {
                $match: {
                    "tripDetails.preferredDate": { $type: "date" },
                },
            },
            {
                $project: {
                    year: { $year: "$tripDetails.preferredDate" },
                },
            },
            {
                $group: {
                    _id: "$year",
                },
            },
            {
                $sort: { _id: -1 },
            },
        ]);

        const currentYear = new Date().getFullYear();
        const availableYears = [...new Set([currentYear, ...availableYearsRaw.map((entry) => entry._id).filter(Boolean)])]
            .sort((leftYear, rightYear) => rightYear - leftYear);

        res.json({
            filters: {
                month,
                year: dateFilter?.resolvedYear || year || null,
            },
            availableYears,
            summary,
            reports,
        });
    } catch (error) {
        console.error("Get booking reports error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==================== USER MANAGEMENT ====================

// @desc    Get all users (masks sensitive data - no password)
// @route   GET /api/admin/users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: "admin" } })
            .select("-password -resetOtp -resetOtpExpiry")
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get single user by ID (masks sensitive data - no password)
// @route   GET /api/admin/user/:id
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password -resetOtp -resetOtpExpiry");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "admin") {
            return res.status(403).json({ message: "Cannot view admin user details" });
        }

        res.json(user);
    } catch (error) {
        console.error("Get user by id error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Update user (Admin can only update: role, accountStatus, isVerified, guideStatus)
// @route   PUT /api/admin/user/:id
export const updateUser = async (req, res) => {
    try {
        const { role, accountStatus, isVerified, guideStatus } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "admin") {
            return res.status(403).json({ message: "Cannot modify admin users" });
        }

        // Only allow updating specific fields (not personal details like name, bio, password)
        if (role !== undefined && ["tourist", "guide"].includes(role)) {
            user.role = role;
        }

        if (accountStatus !== undefined && ["active", "suspended"].includes(accountStatus)) {
            user.accountStatus = accountStatus;
        }

        if (isVerified !== undefined && typeof isVerified === "boolean") {
            user.isVerified = isVerified;
        }

        if (guideStatus !== undefined && [null, "pending", "approved", "rejected", "documents_requested"].includes(guideStatus)) {
            user.guideStatus = guideStatus;
        }

        await user.save();

        // Return updated user without sensitive data
        const updatedUser = await User.findById(user._id)
            .select("-password -resetOtp -resetOtpExpiry");

        res.json({
            message: "User updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Delete user (Hard delete - permanently removes user from database)
// @route   DELETE /api/admin/user/:id
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "admin") {
            return res.status(403).json({ message: "Cannot delete admin users" });
        }

        // Hard delete - permanently remove from database
        await User.findByIdAndDelete(req.params.id);

        res.json({
            message: "User permanently deleted",
            deletedUserId: req.params.id,
        });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
