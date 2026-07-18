import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { sendPasswordResetOtpEmail } from "../utils/sendPasswordResetOtpEmail.js";

const normalizeGuideAddress = (guideAddress = {}) => ({
    regionCode: guideAddress?.regionCode?.trim?.() || null,
    regionName: guideAddress?.regionName?.trim?.() || null,
    provinceCode: guideAddress?.provinceCode?.trim?.() || null,
    provinceName: guideAddress?.provinceName?.trim?.() || null,
    cityMunicipalityCode: guideAddress?.cityMunicipalityCode?.trim?.() || null,
    cityMunicipalityName: guideAddress?.cityMunicipalityName?.trim?.() || null,
    barangayCode: guideAddress?.barangayCode?.trim?.() || null,
    barangayName: guideAddress?.barangayName?.trim?.() || null,
    streetAddress: guideAddress?.streetAddress?.trim?.() || null,
});

const isGuideAddressComplete = (guideAddress = {}) => Boolean(
    guideAddress.regionCode
    && guideAddress.regionName
    && guideAddress.cityMunicipalityCode
    && guideAddress.cityMunicipalityName
    && guideAddress.barangayCode
    && guideAddress.barangayName
    && guideAddress.streetAddress
);

export const touchLastActivity = async (user) => {
    user.lastActivityAt = new Date();
    await user.save({ validateModifiedOnly: true });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
    try {
        const { email, password, fullName, phoneNumber } = req.body;

        if (!email || !password || !fullName || !phoneNumber) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const user = await User.create({
            email,
            password,
            fullName,
            phoneNumber,
            role: "tourist",
        });

        const token = generateToken(user._id, user.role);

        res.status(201).json({
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            role: user.role,
            guideStatus: user.guideStatus,
            isGuideMode: user.isGuideMode,
            guideAddress: user.guideAddress,
            guideApplicationSubmittedAt: user.guideApplicationSubmittedAt,
            livenessCheckStatus: user.livenessCheckStatus,
            livenessCapturedAt: user.livenessCapturedAt,
            token,
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
};

// @desc    Apply to become a guide (for existing tourists)
// @route   POST /api/auth/apply-guide
export const applyForGuide = async (req, res) => {
    try {
        const { contactNumber, accreditationFile, accreditationFileName, guideAddress, livenessSelfie, livenessCapturedAt } = req.body;
        const userId = req.user._id;
        const normalizedGuideAddress = normalizeGuideAddress(guideAddress);

        if (!contactNumber || !accreditationFile || !livenessSelfie) {
            return res.status(400).json({ message: "Please provide contact number, accreditation document, and liveness selfie" });
        }

        if (!isGuideAddressComplete(normalizedGuideAddress)) {
            return res.status(400).json({ message: "Please complete your PSGC-based guide address" });
        }

        if (!livenessSelfie.startsWith("data:image/")) {
            return res.status(400).json({ message: "Invalid liveness selfie format" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.guideStatus === "pending") {
            return res.status(400).json({ message: "You already have a pending guide application" });
        }

        if (user.role === "guide" && user.guideStatus === "approved") {
            return res.status(400).json({ message: "You are already an approved guide" });
        }

        if (!user.profilePicture) {
            return res.status(400).json({ message: "A profile picture is required before applying as a guide" });
        }

        const normalizedLivenessCapturedAt = livenessCapturedAt ? new Date(livenessCapturedAt) : new Date();

        user.guideStatus = "pending";
        user.contactNumber = contactNumber;
        user.accreditationUrl = accreditationFile;
        user.accreditationFileName = accreditationFileName || "credential.pdf";
        user.guideApplicationSubmittedAt = new Date();
        user.guideAddress = normalizedGuideAddress;
        user.livenessSelfieUrl = livenessSelfie;
        user.livenessCapturedAt = Number.isNaN(normalizedLivenessCapturedAt.getTime()) ? new Date() : normalizedLivenessCapturedAt;
        user.livenessCheckStatus = "pending";
        user.livenessRejectionReason = null;
        user.rejectionReason = null;
        user.documentRequestReason = null;
        await user.save();

        res.json({
            message: "Guide application submitted successfully! Please wait for admin approval.",
            guideStatus: user.guideStatus,
            guideApplicationSubmittedAt: user.guideApplicationSubmittedAt,
            guideAddress: user.guideAddress,
            livenessCheckStatus: user.livenessCheckStatus,
            livenessCapturedAt: user.livenessCapturedAt,
        });
    } catch (error) {
        console.error("Apply for guide error:", error);
        res.status(500).json({ message: "Server error during guide application" });
    }
};

// @desc    Toggle guide mode (for approved guides)
// @route   PUT /api/auth/toggle-guide-mode
export const toggleGuideMode = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== "guide" || user.guideStatus !== "approved") {
            return res.status(403).json({ message: "You must be an approved guide to toggle guide mode" });
        }

        user.isGuideMode = !user.isGuideMode;
        user.lastActivityAt = new Date();
        await user.save({ validateModifiedOnly: true });

        res.json({
            message: user.isGuideMode ? "Switched to Guide Mode" : "Switched to Tourist Mode",
            isGuideMode: user.isGuideMode,
        });
    } catch (error) {
        console.error("Toggle guide mode error:", error);
        res.status(500).json({ message: "Server error" });
    }
};




// @desc    Unified login
// @route   POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Update last activity for guides BEFORE sending response to prevent ERR_HTTP_HEADERS_SENT
        if (user.role === "guide") {
            user.lastActivityAt = new Date();
            await user.save({ validateModifiedOnly: true });
        }

        const token = generateToken(user._id, user.role);

        return res.json({
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            profilePicture: user.profilePicture,
            role: user.role,
            guideStatus: user.guideStatus,
            contactNumber: user.contactNumber,
            isGuideMode: user.isGuideMode,
            activityStatus: user.activityStatus,
            guideAddress: user.guideAddress,
            guideApplicationSubmittedAt: user.guideApplicationSubmittedAt,
            documentRequestReason: user.documentRequestReason,
            rejectionReason: user.rejectionReason,
            livenessCheckStatus: user.livenessCheckStatus,
            livenessCapturedAt: user.livenessCapturedAt,
            personalization: user.personalization,
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error during login" });
    }
};

// @desc    Login admin
// @route   POST /api/auth/admin-login
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        // Check against environment variables for admin credentials
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (email !== adminEmail || password !== adminPassword) {
            return res.status(401).json({ message: "Invalid admin credentials" });
        }

        // Check if admin exists in DB, if not create one
        let admin = await User.findOne({ email: adminEmail, role: "admin" });
        
        if (!admin) {
            admin = await User.create({
                email: adminEmail,
                password: adminPassword,
                fullName: "Super Admin",
                role: "admin",
            });
        }

        const token = generateToken(admin._id, admin.role);

        res.json({
            _id: admin._id,
            email: admin.email,
            fullName: admin.fullName,
            role: admin.role,
            token,
        });
    } catch (error) {
        console.error("Login admin error:", error);
        res.status(500).json({ message: "Server error during admin login" });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        console.error("Get me error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Request password reset (send OTP)
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Please provide email" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No account found with this email" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.resetOtp = otp;
        user.resetOtpExpiry = otpExpiry;
        await user.save();

        let deliveryResult;

        try {
            deliveryResult = await sendPasswordResetOtpEmail({
                email: user.email,
                fullName: user.fullName,
                otp,
            });
        } catch (emailError) {
            user.resetOtp = null;
            user.resetOtpExpiry = null;
            await user.save({ validateModifiedOnly: true });
            console.error("Forgot password email error:", emailError);
            return res.status(500).json({ message: "Failed to send OTP email" });
        }

        res.json({ 
            message: "OTP sent to your email",
            mockOtp: deliveryResult?.mockOtp,
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Please provide email and OTP" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No account found with this email" });
        }

        if (user.resetOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (new Date() > user.resetOtpExpiry) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        res.json({ message: "OTP verified successfully", verified: true });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No account found with this email" });
        }

        if (user.resetOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (new Date() > user.resetOtpExpiry) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        user.password = newPassword;
        user.resetOtp = null;
        user.resetOtpExpiry = null;
        await user.save();

        res.json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
