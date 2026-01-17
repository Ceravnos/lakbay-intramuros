import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import TourGuide from "../models/TourGuide.js";

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Not authorized, no token provided" });
        }

        const token = authHeader.split(" ")[1];
        
        const decoded = verifyToken(token);
        
        // Check if user exists in User collection or TourGuide collection
        let user = await User.findById(decoded.userId).select("-password");
        
        if (!user) {
            user = await TourGuide.findById(decoded.userId).select("-password");
        }
        
        if (!user) {
            return res.status(401).json({ message: "Not authorized, user not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({ message: "Not authorized, token invalid" });
    }
};

// Admin only middleware
export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({ message: "Access denied. Admin only." });
    }
};

// Approved guide only middleware
export const approvedGuideOnly = (req, res, next) => {
    if (req.user && req.user.role === "guide") {
        // Fix: Use guideStatus instead of status to match the User model schema
        if (req.user.guideStatus === "approved") {
            next();
        } else {
            return res.status(403).json({ 
                message: "Access denied. Your account is pending approval.",
                guideStatus: req.user.guideStatus 
            });
        }
    } else {
        return res.status(403).json({ message: "Access denied. Guide only." });
    }
};

// Tourist only middleware
export const touristOnly = (req, res, next) => {
    if (req.user && req.user.role === "tourist") {
        next();
    } else {
        return res.status(403).json({ message: "Access denied. Tourist only." });
    }
};
