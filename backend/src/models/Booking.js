import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        touristId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        guideId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        itineraryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Itinerary",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "completed", "cancelled", "rejected"],
            default: "pending",
        },
        tripDetails: {
            title: {
                type: String,
                required: true,
            },
            preferredDate: {
                type: Date,
                required: true,
            },
            numberOfPeople: {
                type: Number,
                default: 1,
            },
            notes: {
                type: String,
                default: "",
            },
        },
        acceptedAt: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
