import Itinerary from "../models/Itinerary.js";

// @desc    Create a new itinerary
// @route   POST /api/itineraries
export const createItinerary = async (req, res) => {
    try {
        const { name, description, locations, preferredDate, numberOfPeople } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Please provide an itinerary name" });
        }

        const itinerary = await Itinerary.create({
            userId: req.user._id,
            name,
            description: description || "",
            locations: locations || [],
            preferredDate,
            numberOfPeople: numberOfPeople || 1,
            status: "draft",
        });

        res.status(201).json(itinerary);
    } catch (error) {
        console.error("Create itinerary error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get all itineraries for current user
// @route   GET /api/itineraries
export const getMyItineraries = async (req, res) => {
    try {
        const itineraries = await Itinerary.find({ userId: req.user._id })
            .sort({ updatedAt: -1 });

        res.json(itineraries);
    } catch (error) {
        console.error("Get itineraries error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get single itinerary by ID
// @route   GET /api/itineraries/:id
export const getItineraryById = async (req, res) => {
    try {
        const itinerary = await Itinerary.findById(req.params.id);

        if (!itinerary) {
            return res.status(404).json({ message: "Itinerary not found" });
        }

        // Check ownership (unless admin)
        if (itinerary.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to view this itinerary" });
        }

        res.json(itinerary);
    } catch (error) {
        console.error("Get itinerary error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Update itinerary
// @route   PUT /api/itineraries/:id
export const updateItinerary = async (req, res) => {
    try {
        const { name, description, locations, preferredDate, numberOfPeople, status } = req.body;

        const itinerary = await Itinerary.findById(req.params.id);

        if (!itinerary) {
            return res.status(404).json({ message: "Itinerary not found" });
        }

        // Check ownership
        if (itinerary.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this itinerary" });
        }

        if (name) itinerary.name = name;
        if (description !== undefined) itinerary.description = description;
        if (locations) itinerary.locations = locations;
        if (preferredDate) itinerary.preferredDate = preferredDate;
        if (numberOfPeople) itinerary.numberOfPeople = numberOfPeople;
        if (status) itinerary.status = status;

        await itinerary.save();

        res.json(itinerary);
    } catch (error) {
        console.error("Update itinerary error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Add location to itinerary
// @route   POST /api/itineraries/:id/locations
export const addLocation = async (req, res) => {
    try {
        const { placeId, name, address, lat, lng, notes } = req.body;

        if (!placeId || !name || lat === undefined || lng === undefined) {
            return res.status(400).json({ message: "Please provide place details" });
        }

        const itinerary = await Itinerary.findById(req.params.id);

        if (!itinerary) {
            return res.status(404).json({ message: "Itinerary not found" });
        }

        if (itinerary.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const newLocation = {
            placeId,
            name,
            address: address || "",
            lat,
            lng,
            order: itinerary.locations.length,
            notes: notes || "",
        };

        itinerary.locations.push(newLocation);
        await itinerary.save();

        res.json(itinerary);
    } catch (error) {
        console.error("Add location error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Remove location from itinerary
// @route   DELETE /api/itineraries/:id/locations/:locationId
export const removeLocation = async (req, res) => {
    try {
        const itinerary = await Itinerary.findById(req.params.id);

        if (!itinerary) {
            return res.status(404).json({ message: "Itinerary not found" });
        }

        if (itinerary.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        itinerary.locations = itinerary.locations.filter(
            loc => loc._id.toString() !== req.params.locationId
        );

        // Reorder remaining locations
        itinerary.locations.forEach((loc, index) => {
            loc.order = index;
        });

        await itinerary.save();

        res.json(itinerary);
    } catch (error) {
        console.error("Remove location error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Reorder locations in itinerary
// @route   PUT /api/itineraries/:id/reorder
export const reorderLocations = async (req, res) => {
    try {
        const { locationIds } = req.body;

        const itinerary = await Itinerary.findById(req.params.id);

        if (!itinerary) {
            return res.status(404).json({ message: "Itinerary not found" });
        }

        if (itinerary.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Reorder based on provided array
        const reorderedLocations = locationIds.map((id, index) => {
            const location = itinerary.locations.find(loc => loc._id.toString() === id);
            if (location) {
                location.order = index;
            }
            return location;
        }).filter(Boolean);

        itinerary.locations = reorderedLocations;
        await itinerary.save();

        res.json(itinerary);
    } catch (error) {
        console.error("Reorder locations error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Delete itinerary
// @route   DELETE /api/itineraries/:id
export const deleteItinerary = async (req, res) => {
    try {
        const itinerary = await Itinerary.findById(req.params.id);

        if (!itinerary) {
            return res.status(404).json({ message: "Itinerary not found" });
        }

        if (itinerary.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Itinerary.findByIdAndDelete(req.params.id);

        res.json({ message: "Itinerary deleted" });
    } catch (error) {
        console.error("Delete itinerary error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
