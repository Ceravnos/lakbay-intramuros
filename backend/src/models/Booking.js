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
            enum: ["pending", "accepted", "awaiting_payment", "paid", "scheduled", "active", "completed", "cancelled", "rejected"],
            default: "pending",
        },
        scheduledAt: {
            type: Date,
            default: null,
        },
        startedAt: {
            type: Date,
            default: null,
        },
        isRated: {
            type: Boolean,
            default: false,
        },
        timeSlot: {
            type: String,
            enum: ["AM", "PM"],
            required: true,
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
        progress: {
            completedStopCount: {
                type: Number,
                default: 0,
                min: 0,
            },
            totalStops: {
                type: Number,
                default: 0,
                min: 0,
            },
            updatedAt: {
                type: Date,
                default: null,
            },
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

bookingSchema.index({ guideId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ guideId: 1, status: 1, "tripDetails.preferredDate": 1 });
bookingSchema.index({ guideId: 1, timeSlot: 1, "tripDetails.preferredDate": 1, status: 1 });
bookingSchema.index({ touristId: 1, itineraryId: 1, status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
