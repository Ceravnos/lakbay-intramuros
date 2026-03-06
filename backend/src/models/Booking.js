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
        isRated: {
            type: Boolean,
            default: false,
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
            priorityAssistance: {
                type: [String],
                default: [],
            },
            meetingPoint: {
                type: String,
                default: "",
            },
        },
        revisionRequested: {
            type: Boolean,
            default: false,
        },
        revisionNote: {
            type: String,
            default: "",
        },
        proposedItinerary: {
            locations: [{
                placeId: String,
                name: String,
                address: String,
                lat: Number,
                lng: Number,
                order: Number,
                notes: String,
            }],
            preferredDate: Date,
            numberOfPeople: Number,
        },
        rejectedAt: {
            type: Date,
            default: null,
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
