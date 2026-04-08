import mongoose from "mongoose";

interface IClan {
    name: string;
    memberCount: number;
    image: string;
    groupLink: string
}

type IClanModel = mongoose.Model<IClan> & {};

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter clan name"],
        unique: true,
    },
    memberCount: {
        type: Number,
        default: 0,
    },
    image: {
        type: String,
        default: "",
    },
    groupLink: {
        type: String,
        default: "",
    }
});

schema.index({ name: 1 });

export const Clan = mongoose.model<IClan, IClanModel>("Clan", schema);