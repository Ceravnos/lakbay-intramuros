import express from "express";
import { submitRating } from "../controllers/submitRatingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, submitRating);

export default router;
