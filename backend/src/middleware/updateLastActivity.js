import User from "../models/User.js";

export const updateLastActivity = async (req, res, next) => {
    if (!req.user?._id) return next();

    await User.findByIdAndUpdate(req.user._id, {
        lastActivityAt: new Date(),
    });

    next();
};