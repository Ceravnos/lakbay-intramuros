import express from "express";
import {
    createPayment,
    handleWebhook,
    getPaymentByBooking,
    verifyPayment,
} from "../controllers/paymentController.js";
import { protect, touristOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Webhook route - NO authentication (called by PayMongo)
router.post("/webhook", handleWebhook);

// Protected routes
router.post("/create", protect, touristOnly, createPayment);
router.get("/:bookingId", protect, getPaymentByBooking);
router.post("/verify/:bookingId", protect, touristOnly, verifyPayment);

export default router;
