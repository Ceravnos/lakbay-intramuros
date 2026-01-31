import User from "../models/User.js";

// @desc    Get all pending guide applications
// @route   GET /api/admin/pending-guides
export const getPendingGuides = async (req, res) => {
    try {
        const pendingGuides = await User.find({ guideStatus: "pending" })
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
            guideStatus: { $in: ["pending", "approved", "rejected"] }
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
