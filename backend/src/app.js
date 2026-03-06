import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import http from "http";

import travelRoutes from "./routes/travelRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import itineraryRoutes from "./routes/itineraryRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import { initSocket } from "./config/socket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000
const __dirname = path.resolve()

// *MIDDLEWARE*
// CORS configuration for both development and production
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
    "https://lakbay-intramuros.onrender.com"
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (mobile apps, curl, etc.)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.use(express.json({ limit: '10mb' })) // Parse the JSON bodies: req.body
app.use(rateLimiter)

// example of simple custom middleware
// app.use((req, res, next) => {
//  console.log(`Req method is ${req.method} & Req URL is ${req.url}`);
//  next();
// })
 
app.use("/api/travel", travelRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/itineraries", itineraryRoutes)
app.use("/api/users", userRoutes)
app.use("/api/ratings", ratingRoutes);
app.use("/api/payments", paymentRoutes);


// *FOR PRODUCTION ONLY*
if(process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname,"../frontend/dist")))
    // Serve the app as an static asset 
    app.get("*", (req,res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"))
    })
}



/* ======================
   START SERVER
====================== */
const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`[app.js] Server started on PORT: ${PORT}`);
    });
});


 