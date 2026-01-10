import express from "express";
import {
    createItinerary,
    getMyItineraries,
    getItineraryById,
    updateItinerary,
    addLocation,
    removeLocation,
    reorderLocations,
    deleteItinerary,
} from "../controllers/itineraryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

router.route("/")
    .get(getMyItineraries)
    .post(createItinerary);

router.route("/:id")
    .get(getItineraryById)
    .put(updateItinerary)
    .delete(deleteItinerary);

router.post("/:id/locations", addLocation);
router.delete("/:id/locations/:locationId", removeLocation);
router.put("/:id/reorder", reorderLocations);

export default router;
