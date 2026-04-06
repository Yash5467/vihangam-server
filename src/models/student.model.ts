import mongoose from "mongoose";

interface IStudent {
    enrollmentNumber: string;
    name: string;
    email: string;
    branch: string;
    course: string;
    clanId: mongoose.Types.ObjectId | null;
}

type IStudentModel = mongoose.Model<IStudent> & {};

const schema = new mongoose.Schema({
    enrollmentNumber: {
        type: String,
        required: [true, "Please enter enrollment number"],
        unique: true,
    },
    name: {
        type: String,
        required: [true, "Please enter name"],
    },

    email: {
        type: String,
        required: false,
        unique: true,
    },
    branch: {
        type: String,
        required: [true, "Please enter branch"],
    },
    course: {
        type: String,
        required: [true, "Please enter course"],
    },
    clanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clan",
        default: null,
    },
});

schema.index({ enrollmentNumber: 1 });
schema.index({ email: 1 });
schema.index({ clanId: 1 });

export const Student = mongoose.model<IStudent, IStudentModel>("Student", schema);