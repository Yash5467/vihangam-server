import mongoose from "mongoose";


interface IWinner {
    eventId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    position: number;
    prizeTitle?: string;
    prizeAmount?: number;
    notes?: string;
    awardedAt: Date;
    awardedBy?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

export type IWinnerSchema = mongoose.Model<IWinner> & {};

const winnerSchema = new mongoose.Schema<IWinner>({
    eventId: { type: mongoose.Types.ObjectId, required: true, ref: "Event" },
    studentId: { type: mongoose.Types.ObjectId, required: true, ref: "Student" },
    position: { type: Number, required: true, min: 1, max: 100 },
    prizeTitle: { type: String, trim: true, maxlength: 120 },
    prizeAmount: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, maxlength: 500 },
    awardedAt: { type: Date, required: true, default: Date.now },
    awardedBy: { type: mongoose.Types.ObjectId, ref: "User", default: null },
}, {
    timestamps: true,
    versionKey: false,
});

winnerSchema.index({ eventId: 1, position: 1 }, { unique: true });
winnerSchema.index({ eventId: 1, studentId: 1 }, { unique: true });
winnerSchema.index({ studentId: 1, awardedAt: -1 });

export const Winner = mongoose.model<IWinner, IWinnerSchema>("Winner", winnerSchema);