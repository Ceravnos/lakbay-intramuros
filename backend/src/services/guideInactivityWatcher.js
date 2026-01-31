import User from "../models/User.js";

const INACTIVITY_LIMIT_MS = 1 * 600 * 1000; // 1 minute

export const startGuideInactivityWatcher = () => {
    console.log("🕒 Guide inactivity watcher started");

    setInterval(async () => {
        try {
            const cutoff = new Date(Date.now() - INACTIVITY_LIMIT_MS);

            const result = await User.updateMany(
                {
                    role: "guide",
                    activityStatus: "active",
                    lastActivityAt: { $lt: cutoff }
                },
                {
                    $set: { activityStatus: "inactive" }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(
                    `⚠️ Auto-inactivated ${result.modifiedCount} inactive guide(s)`
                );
            }
        } catch (err) {
            console.error("Guide inactivity watcher error:", err);
        }
    }, 30 * 1000); // run every 30 seconds
};
