import Booking from "../models/Booking.js";
import User from "../models/User.js";

export const submitRating = async (req, res) => {
  try {
    const { bookingId, guideId, rating } = req.body;
    const userId = req.user._id;

    console.log("REQ BODY:", req.body);        // <-- what frontend sent
    console.log("USER ID:", userId);          // <-- authenticated user

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    console.log("BOOKING:", {
      status: booking.status,
      isRated: booking.isRated,
      bookingGuide: booking.guideId.toString(),
      touristId: booking.touristId.toString()
    });

    // Guardrails
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be 1-5" });

    if (!guideId)
      return res.status(400).json({ message: "Guide ID is required" });

    if (booking.touristId.toString() !== userId.toString())
      return res.status(403).json({ message: "Not authorized to rate this booking" });

    if (booking.status !== "completed")
      return res.status(400).json({ message: "Booking not completed" });

    if (booking.isRated)
      return res.status(400).json({ message: "Booking already rated" });

    if (booking.guideId.toString() !== guideId.toString())
      return res.status(400).json({ message: "Guide mismatch" });

    const guide = await User.findById(guideId);
    if (!guide || guide.role !== "guide")
      return res.status(404).json({ message: "Guide not found" });
    

    guide.totalStars += rating;
    guide.totalRatings += 1;
    await guide.save();

    booking.isRated = true;
    await booking.save();

    return res.status(200).json({ message: "Rating submitted successfully" });

  } catch (error) {
    console.error("Submit rating error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
