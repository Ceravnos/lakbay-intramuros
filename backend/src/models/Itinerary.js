import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
    placeId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        default: "",
    },
    lat: {
        type: Number,
        required: true,
    },
    lng: {
        type: Number,
        required: true,
    },
    order: {
        type: Number,
        required: true,
    },
    notes: {
        type: String,
        default: "",
    },
});

const itinerarySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        locations: [locationSchema],
        preferredDate: {
            type: Date,
            default: null,
        },
        numberOfPeople: {
            type: Number,
            default: 1,
        },
        status: {
            type: String,
            enum: ["draft", "planned", "booked", "completed"],
            default: "draft",
        },
    },
    { timestamps: true }
);

const Itinerary = mongoose.model("Itinerary", itinerarySchema);

export default Itinerary;
