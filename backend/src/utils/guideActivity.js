import User from "../models/User.js";

export const setGuideActivityStatus = async (user, status) => {
    user.activityStatus = status;
    await user.save();
};
