import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import travelRoutes from "./routes/travelRoutes.js";
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000

//middleware
app.use(
    cors({
        origin: "http://localhost:5173",
    })
);
app.use(express.json()) // this middleware will parse the JSON bodies: req.body
app.use(rateLimiter)

// example of simple custom middleware
// app.use((req, res, next) => {
//  console.log(`Req method is ${req.method} & Req URL is ${req.url}`);
//  next();
// })
 
app.use("/api/travel", travelRoutes)

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("[app.js] Server started on PORT: 4000");
    });
});


 