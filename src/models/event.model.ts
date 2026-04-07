import mongoose from "mongoose";


interface IEvent {
    title: string;
    description: string;
    date: Date;
    spotsAvailable: number;
    venue: string;
    registrationAmount: number;
    banner: string,
    rules: string[];
    status: "upcoming" | "ongoing" | "completed" | "cancelled";
    contactInfo: {
        name: string;
        phoneNumber: string;
    }[];
    clanPoints: number;
}


export type IEventSchema = mongoose.Model<IEvent> & {};


const eventSchema = new mongoose.Schema<IEvent>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    spotsAvailable: { type: Number, required: true },
    venue: { type: String, required: true },
    registrationAmount: { type: Number, required: true },
    banner: { type: String, required: true },
    rules: { type: [String], required: true },
    contactInfo: [
        {
            name: { type: String, required: true },
            phoneNumber: { type: String, required: true },
        },
    ],
    clanPoints: { type: Number, required: true },
    status: {
        type: String,
        enum: ["upcoming", "ongoing", "completed", "cancelled"],
        default: "upcoming",
        required: true,
    }
});

export const Event = mongoose.model<IEvent, IEventSchema>("Event", eventSchema);
