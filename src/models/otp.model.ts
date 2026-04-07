import mongoose from "mongoose";

const OTP_PURPOSES = ["event_registration","entry_pass_generation"] as const;
type OtpPurpose = (typeof OTP_PURPOSES)[number];

interface IOTP {
    studentId: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    otp: string;
    purpose: OtpPurpose;
    expiresAt: Date;
    isUsed: boolean;
    usedAt?: Date | null;
    attempts: number;
    createdAt: Date;
    updatedAt: Date;
}

export type IOTPSchema = mongoose.Model<IOTP> & {};

const otpSchema = new mongoose.Schema<IOTP>({
    studentId: { type: mongoose.Types.ObjectId, required: true, ref: "Student" },
    eventId: { type: mongoose.Types.ObjectId, required: true, ref: "Event" },
    otp: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 8,
        match: /^\d+$/,
    },
    purpose: {
        type: String,
        enum: OTP_PURPOSES,
        default: "event_registration",
        required: true,
    },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, required: true, default: false },
    usedAt: { type: Date, default: null },
    attempts: { type: Number, required: true, default: 0, min: 0, max: 10 },
}, {
    timestamps: true,
    versionKey: false,
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ studentId: 1, eventId: 1, purpose: 1, isUsed: 1 });

otpSchema.pre("validate", function () {
    if (this.isUsed && !this.usedAt) {
        this.usedAt = new Date();
    }

    if (!this.isUsed) {
        this.usedAt = null;
    }
});


export const OTP = mongoose.model<IOTP, IOTPSchema>("OTP", otpSchema);