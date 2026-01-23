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
        role: {
            type: String,
            enum: ["tourist", "guide", "admin"],
            default: "tourist",
        },
        // Guide application fields
        guideStatus: {
            type: String,
            enum: [null, "pending", "approved", "rejected"],
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
