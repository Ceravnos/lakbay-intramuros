import mongoose from "mongoose";

const travelSchema = new mongoose.Schema(
    {
        title: {
            type:String,
            required: true
        },
        content:{
            type: String,
            required: true,      
        }
    },
    { timestamps: true } // createdAt, updatedAt
);

const Travel = mongoose.model("Travel", travelSchema)

export default Travel