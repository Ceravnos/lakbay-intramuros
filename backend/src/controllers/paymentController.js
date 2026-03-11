import axios from "axios";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import { emitToUser, emitToGuide } from "../config/socket.js";

const PAYMONGO_API = "https://api.paymongo.com/v1";

// Helper to create base64 encoded auth header for PayMongo
const getPayMongoAuthHeader = () => {
    const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
    if (!PAYMONGO_SECRET_KEY) {
        throw new Error("PAYMONGO_SECRET_KEY is not set in environment variables");
    }
    // PayMongo uses the secret key as username with empty password
    return "Basic " + Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString("base64");
};

// @desc    Create a PayMongo checkout session and store pending payment
// @route   POST /api/payments/create
export const createPayment = async (req, res) => {
    try {
        const { bookingId, amount } = req.body;
        const touristId = req.user._id;

        if (!bookingId || !amount) {
            return res.status(400).json({ message: "Booking ID and amount are required" });
        }

        // Validate PayMongo secret key is configured
        const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
        if (!PAYMONGO_SECRET_KEY) {
            console.error("[Payment] PAYMONGO_SECRET_KEY is not set in environment variables");
            return res.status(500).json({ message: "Payment system not configured. Please contact support." });
        }

        // Validate secret key format (should start with sk_test_ or sk_live_)
        if (!PAYMONGO_SECRET_KEY.startsWith('sk_test_') && !PAYMONGO_SECRET_KEY.startsWith('sk_live_')) {
            console.error("[Payment] Invalid PAYMONGO_SECRET_KEY format. Must start with sk_test_ or sk_live_");
            return res.status(500).json({ message: "Payment system misconfigured. Please contact support." });
        }

        // Validate booking exists and belongs to this tourist
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.touristId.toString() !== touristId.toString()) {
            return res.status(403).json({ message: "You can only pay for your own bookings" });
        }

        if (booking.status !== "awaiting_payment") {
            return res.status(400).json({ message: "This booking is not awaiting payment" });
        }

        // Check if there's already a pending payment for this booking
        const existingPayment = await Payment.findOne({
            bookingId,
            status: "pending",
        });

        if (existingPayment && existingPayment.checkoutUrl) {
            // Return existing checkout URL if payment is still pending
            return res.json({
                message: "Existing payment session found",
                checkoutUrl: existingPayment.checkoutUrl,
                payment: existingPayment,
            });
        }

        // Amount in centavos (PayMongo requires amount in smallest currency unit)
        const amountInCentavos = Math.round(amount * 100);

        // Determine success/failure redirect URLs
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        // Create PayMongo Checkout Session
        const checkoutResponse = await axios.post(
            `${PAYMONGO_API}/checkout_sessions`,
            {
                data: {
                    attributes: {
                        send_email_receipt: false,
                        show_description: true,
                        show_line_items: true,
                        description: `Payment for tour booking: ${booking.tripDetails?.title || "Lakbay Intramuros Tour"}`,
                        line_items: [
                            {
                                currency: "PHP",
                                amount: amountInCentavos,
                                name: booking.tripDetails?.title || "Lakbay Intramuros Tour",
                                quantity: 1,
                            },
                        ],
                        payment_method_types: ["gcash"],
                        success_url: `${frontendUrl}/dashboard?payment=success&bookingId=${bookingId}`,
                        cancel_url: `${frontendUrl}/dashboard?payment=cancelled&bookingId=${bookingId}`,
                        metadata: {
                            bookingId: bookingId.toString(),
                            touristId: touristId.toString(),
                        },
                    },
                },
            },
            {
                headers: {
                    Authorization: getPayMongoAuthHeader(),
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        const checkoutSession = checkoutResponse.data.data;
        const checkoutUrl = checkoutSession.attributes.checkout_url;
        const checkoutSessionId = checkoutSession.id;

        // Create payment record
        const payment = await Payment.create({
            bookingId,
            touristId,
            amount,
            currency: "PHP",
            status: "pending",
            paymentProvider: "PayMongo",
            paymentIntentId: checkoutSessionId,
            checkoutUrl,
        });

        res.status(201).json({
            message: "Payment session created",
            checkoutUrl,
            payment,
        });
    } catch (error) {
        console.error("Create payment error:", error.response?.data || error.message);
        res.status(500).json({
            message: "Failed to create payment session",
            error: error.response?.data?.errors?.[0]?.detail || error.message,
        });
    }
};

// @desc    Handle PayMongo webhook events
// @route   POST /api/payments/webhook
export const handleWebhook = async (req, res) => {
    try {
        const event = req.body?.data;

        if (!event) {
            return res.status(400).json({ message: "Invalid webhook payload" });
        }

        const eventType = event.attributes?.type;
        const eventData = event.attributes?.data;

        console.log(`[PayMongo Webhook] Event type: ${eventType}`);

        if (eventType === "checkout_session.payment.paid") {
            const checkoutSessionId = eventData?.id;
            const metadata = eventData?.attributes?.metadata;
            const bookingId = metadata?.bookingId;

            if (!bookingId) {
                console.error("[PayMongo Webhook] No bookingId in metadata");
                return res.status(200).json({ message: "No bookingId found, skipping" });
            }

            // Update payment status
            const payment = await Payment.findOne({
                bookingId,
                status: "pending",
            });

            if (payment) {
                payment.status = "paid";
                if (checkoutSessionId) {
                    payment.paymentIntentId = checkoutSessionId;
                }
                await payment.save();
            }

            // Update booking status to scheduled (paid and waiting for trip date)
            const booking = await Booking.findById(bookingId)
                .populate("touristId", "fullName email")
                .populate("guideId", "fullName email")
                .populate("itineraryId");
                
            if (booking && booking.status === "awaiting_payment") {
                booking.status = "scheduled";
                booking.scheduledAt = new Date();
                await booking.save();
                console.log(`[PayMongo Webhook] Booking ${bookingId} marked as scheduled`);

                // Emit socket events to notify both tourist and guide
                emitToUser(booking.touristId._id.toString(), "payment-paid", booking);
                if (booking.guideId) {
                    emitToGuide(booking.guideId._id.toString(), "payment-paid", booking);
                }
            }
        }

        // Always respond 200 to acknowledge receipt
        res.status(200).json({ message: "Webhook received" });
    } catch (error) {
        console.error("Webhook error:", error);
        // Still return 200 to prevent PayMongo from retrying
        res.status(200).json({ message: "Webhook processing error" });
    }
};

// @desc    Get payment details for a booking
// @route   GET /api/payments/:bookingId
export const getPaymentByBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Only the tourist who owns the booking or the assigned guide can view payment
        const isOwner = booking.touristId.toString() === userId.toString();
        const isGuide = booking.guideId && booking.guideId.toString() === userId.toString();

        if (!isOwner && !isGuide) {
            return res.status(403).json({ message: "Not authorized to view this payment" });
        }

        const payment = await Payment.findOne({ bookingId }).sort({ createdAt: -1 });

        if (!payment) {
            return res.status(404).json({ message: "No payment found for this booking" });
        }

        res.json(payment);
    } catch (error) {
        console.error("Get payment error:", error);
        res.status(500).json({ message: "Server error fetching payment" });
    }
};

// @desc    Verify payment status by checking PayMongo checkout session (fallback polling)
// @route   POST /api/payments/verify/:bookingId
export const verifyPayment = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const touristId = req.user._id;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.touristId.toString() !== touristId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const payment = await Payment.findOne({ bookingId, status: "pending" });
        if (!payment || !payment.paymentIntentId) {
            return res.status(404).json({ message: "No pending payment found" });
        }

        // Check checkout session status from PayMongo
        const response = await axios.get(
            `${PAYMONGO_API}/checkout_sessions/${payment.paymentIntentId}`,
            {
                headers: {
                    Authorization: getPayMongoAuthHeader(),
                    Accept: "application/json",
                },
            }
        );

        const session = response.data.data;
        const paymentStatus = session.attributes?.payment_intent?.attributes?.status;
        const payments = session.attributes?.payments;

        // Check if payment was successful
        const isPaid =
            paymentStatus === "succeeded" ||
            (payments && payments.length > 0 && payments[0]?.attributes?.status === "paid");

        if (isPaid) {
            // Update payment record
            payment.status = "paid";
            await payment.save();

            // Update booking status to scheduled
            if (booking.status === "awaiting_payment") {
                booking.status = "scheduled";
                booking.scheduledAt = new Date();
                await booking.save();

                // Populate for socket emission
                const populatedBooking = await Booking.findById(bookingId)
                    .populate("touristId", "fullName email")
                    .populate("guideId", "fullName email")
                    .populate("itineraryId");

                // Emit socket events to notify both tourist and guide
                emitToUser(populatedBooking.touristId._id.toString(), "payment-paid", populatedBooking);
                if (populatedBooking.guideId) {
                    emitToGuide(populatedBooking.guideId._id.toString(), "payment-paid", populatedBooking);
                }
            }

            return res.json({
                message: "Payment verified successfully",
                status: "paid",
                booking,
                payment,
            });
        }

        res.json({
            message: "Payment not yet completed",
            status: payment.status,
        });
    } catch (error) {
        console.error("Verify payment error:", error.response?.data || error.message);
        res.status(500).json({ message: "Failed to verify payment" });
    }
};
