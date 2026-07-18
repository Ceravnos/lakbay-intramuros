import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
        },
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
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "PHP",
        },
        status: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
        },
        paymentProvider: {
            type: String,
            default: "PayMongo",
        },
        paymentIntentId: {
            type: String,
            default: null,
        },
        checkoutUrl: {
            type: String,
            default: null,
        },
        paidAt: {
            type: Date,
            default: null,
        },
        guidePayoutStatus: {
            type: String,
            enum: ["unavailable", "available", "sandbox_paid_out"],
            default: "unavailable",
        },
        guidePayoutAt: {
            type: Date,
            default: null,
        },
        guidePayoutBatchId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

paymentSchema.index({ bookingId: 1, createdAt: -1 });
paymentSchema.index({ guideId: 1, status: 1, guidePayoutStatus: 1, paidAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
