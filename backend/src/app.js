import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path"
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

import travelRoutes from "./routes/travelRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import itineraryRoutes from "./routes/itineraryRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import { startGuideInactivityWatcher } from "./services/guideInactivityWatcher.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000
const __dirname = path.resolve()

// *MIDDLEWARE*
if(process.env.NODE_ENV !== "production"){
    app.use(
        cors({
            origin: "http://localhost:5173",
        })
    );
}

app.use(express.json()) // Parse the JSON bodies: req.body
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

// *FOR PRODUCTION ONLY*
if(process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname,"../frontend/dist")))
    // Serve the app as an static asset 
    app.get("*", (req,res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"))
    })
}

const server = http.createServer(app);

export const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    },
});

/* ======================
   SOCKET AUTH MIDDLEWARE
====================== */
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // Assign the userId properly
        socket.userId = payload.userId; // ✅ THIS IS KEY

        next();
    } catch (err) {
        console.error("Socket auth error:", err);
        next(new Error("Unauthorized"));
    }
});



io.on("connection", (socket) => {
    console.log("Socket connected:", socket.userId);
    // Join a room for this user
    socket.join(socket.userId);
});


/* ======================
   START SERVER
====================== */
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`[app.js] Server started on PORT: ${PORT}`);
    });
});

startGuideInactivityWatcher();


 