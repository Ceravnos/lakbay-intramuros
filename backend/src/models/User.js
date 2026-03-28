import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            trim: true,
            required: function() {
                // phoneNumber is required for tourists and guides, but not for admins
                return this.role !== "admin";
            },
            minlength: 11,
            maxlength: 11,
        },
        profilePicture: {
            type: String,
            default: null,
        },
        role: {
            type: String,
            enum: ["tourist", "guide", "admin"],
            default: "tourist",
        },
        // Guide application fields
        guideStatus: {
            type: String,
            enum: [null, "pending", "approved", "rejected", "documents_requested"],
            default: null,
        },
        documentRequestReason: {
            type: String,
            default: null,
        },
        activityStatus: {
            type: String,
            enum: [null, "active", "inactive", "working"],
            default: "inactive",
        },
        contactNumber: {
            type: String,
            trim: true,
            default: null,
        },
        lastActivityAt: {
            type: Date,
            default: Date.now
        },
        accreditationUrl: {
            type: String,
            default: null,
        },
        accreditationFileName: {
            type: String,
            default: null,
        },
        guideApplicationSubmittedAt: {
            type: Date,
            default: null,
        },
        guideAddress: {
            regionCode: {
                type: String,
                default: null,
            },
            regionName: {
                type: String,
                default: null,
            },
            provinceCode: {
                type: String,
                default: null,
            },
            provinceName: {
                type: String,
                default: null,
            },
            cityMunicipalityCode: {
                type: String,
                default: null,
            },
            cityMunicipalityName: {
                type: String,
                default: null,
            },
            barangayCode: {
                type: String,
                default: null,
            },
            barangayName: {
                type: String,
                default: null,
            },
            streetAddress: {
                type: String,
                trim: true,
                default: null,
            },
        },
        livenessSelfieUrl: {
            type: String,
            default: null,
        },
        livenessCapturedAt: {
            type: Date,
            default: null,
        },
        livenessCheckStatus: {
            type: String,
            enum: [null, "pending", "verified", "rejected"],
            default: null,
        },
        livenessRejectionReason: {
            type: String,
            default: null,
        },
        rejectionReason: {
            type: String,
            default: null,
        },
        // Guide mode toggle (for approved guides)
        isGuideMode: {
            type: Boolean,
            default: false,
        },
        // Personalization preferences for Magic Generate
        personalization: {
            preferredCategories: {
                type: [String],
                default: [],
            },
            maxLocationsPerTrip: {
                type: Number,
                default: 5,
                min: 1,
                max: 10,
            },
        },
        // For password reset
        resetOtp: {
            type: String,
            default: null,
        },
        resetOtpExpiry: {
            type: Date,
            default: null,
        },
        
        totalStars: {
            type: Number,
            default: 0,
        },
        totalRatings: {
            type: Number,
            default: 0,
        },
        // Guide unavailable dates (for guides to mark dates they cannot work)
        unavailableDates: {
            type: [Date],
            default: [],
        },
        // Account status for admin management
        accountStatus: {
            type: String,
            enum: ["active", "suspended"],
            default: "active",
        },
        // Verification status
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
