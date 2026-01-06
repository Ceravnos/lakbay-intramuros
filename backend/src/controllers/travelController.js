import Travel from "../models/Travel.js"

export async function getAllTravels (req, res) {
    try {
        const travel = await Travel.find().sort({ createdAt: -1 }); // newest first
        res.status(200).json(travel)
    } catch (error) {
        console.error("[travelController.js] Error in getAllTravels Controller", error)
        res.status(500).json({ message: "Internal server error" })
    }
};

export async function getTravelById (req, res) {
    try {
        const travel = await Travel.findById(req.params.id)
        if (!travel) return res.status(404).json({ message: "Travel not found"})
        res.json(travel)
    } catch (error) {
        console.error("[travelController.js] Error in getTravelById Controller", error)
        res.status(500).json({ message: "Internal server error" })
    }
};

export async function createTravel (req, res) {
    try {
        const {title, content} = req.body
        const travel = new Travel({ title, content })

        const savedTravel = await travel.save()
        res.status(201).json(savedTravel)
    } catch (error) {
        console.error("[travelController.js] Error in createTravel Controller", error)
        res.status(500).json({ message: "Internal server error" })
    }    
};

export async function updateTravel (req, res) {
    try {
        const { title, content } = req.body
        const updatedTravel = await Travel.findByIdAndUpdate(req.params.id, { title, content }, { new: true, })
        if (!updatedTravel) return res.status(404).json({ message: "Travel not found"})
 
        res.status(200).json(updatedTravel);
    } catch (error) {
        console.error("[travelController.js] Error in updateTravel Controller", error)
        res.status(500).json({ message: "Internal server error" })
    }  
};

export async function deleteTravel (req, res) {
    try {
        const deletedTravel = await Travel.findByIdAndDelete(req.params.id)
        if (!deletedTravel) return res.status(404).json({ message: "Travel not found"})
        res.status(200).json({ message: "Travel deleted succesfully"}) 
    } catch (error) {
        console.error("[travelController.js] Error in deleteTravel Controller", error)
        res.status(500).json({ message: "Internal server error" })
    }  
};