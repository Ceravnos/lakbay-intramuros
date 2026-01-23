import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const tourGuideSchema = new mongoose.Schema(
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
        accreditationFile: {
            type: String, // URL/path to uploaded file
            required: true,
        },
        accreditationFileName: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            default: "guide",
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        rejectionReason: {
            type: String,
            default: null,
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
tourGuideSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
tourGuideSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const TourGuide = mongoose.model("TourGuide", tourGuideSchema);

export default TourGuide;
