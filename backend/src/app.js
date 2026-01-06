import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path"

import travelRoutes from "./routes/travelRoutes.js";
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

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

// *FOR PRODUCTION ONLY*
if(process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname,"../frontend/dist")))
    // Serve the app as an static asset 
    app.get("*", (req,res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"))
    })
}

// *DATABASE CONNECTION*
// Connect to DB before starting the PORT
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("[app.js] Server started on PORT: 4000");
    });
});


 