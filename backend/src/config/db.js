import mongoose from "mongoose"
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)

        console.log("[db.js] MongoDB Connected Successfully!")
    } catch (error) {
        console.error("[db.js] Error connecting to MonggoDB", error)
    }
}

//mongodb+srv://lakbayAdmin:lakbayAdmin123@lakbay-intramuros.ohajp0h.mongodb.net/?appName=lakbay-intramuros 