import express from "express";
import {
    createPayment,
    handleWebhook,
    getPaymentByBooking,
    verifyPayment,
    cashOutGuideEarningsSandbox,
} from "../controllers/paymentController.js";
import { protect, touristOnly, approvedGuideOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Webhook route - NO authentication (called by PayMongo)
router.post("/webhook", handleWebhook);

// Protected routes
router.post("/create", protect, touristOnly, createPayment);
router.post("/guide-cashout-sandbox", protect, approvedGuideOnly, cashOutGuideEarningsSandbox);
router.get("/:bookingId", protect, getPaymentByBooking);
router.post("/verify/:bookingId", protect, touristOnly, verifyPayment);

export default router;
