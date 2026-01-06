import express from "express"
import { createTravel, deleteTravel, getAllTravels, getTravelById, updateTravel } from "../controllers/travelController.js";

const router = express.Router();

router.get("/", getAllTravels);
router.get("/:id", getTravelById);
router.post("/", createTravel);
router.put("/:id", updateTravel);
router.delete("/:id", deleteTravel);


export default router;