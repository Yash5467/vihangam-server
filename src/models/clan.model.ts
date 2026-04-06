import mongoose from "mongoose";

interface IClan {
    name: string;
    memberCount: number;
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
});

schema.index({ name: 1 });

export const Clan = mongoose.model<IClan, IClanModel>("Clan", schema);