import mongoose from "mongoose";

const REGISTRATION_STATUSES = ["initiated", "otp_sent", "otp_verified", "payment_pending", "registered", "cancelled", "failed"] as const;
const PAYMENT_STATUSES = ["not_required", "pending", "success", "failed", "refunded"] as const;
type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

interface IRegistration {
    enrollmentNumber: string;
    eventId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    status: RegistrationStatus;
    paymentStatus: PaymentStatus;
    registrationDate: Date;
    otpId?: mongoose.Types.ObjectId | null;
    otpVerifiedAt?: Date | null;
    paymentTransactionId?: mongoose.Types.ObjectId | null;
    paymentInitiatedAt?: Date | null;
    paymentCompletedAt?: Date | null;
    registrationCompletedAt?: Date | null;
    checkedInAt?: Date | null;
    cancelledAt?: Date | null;
    cancellationReason?: string;
    failureReason?: string;
    paymentAmount: number;
    paymentCurrency: string;
    createdAt: Date;
    updatedAt: Date;
}

export type IRegistrationSchema = mongoose.Model<IRegistration> & {};

const registrationSchema = new mongoose.Schema<IRegistration>({
    enrollmentNumber: { type: String, required: true, trim: true, uppercase: true, minlength: 3, maxlength: 30 },
    eventId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Event" },
    studentId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Student" },
    status: {
        type: String,
        enum: REGISTRATION_STATUSES,
        default: "initiated",
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: PAYMENT_STATUSES,
        default: "pending",
        required: true,
    },
    registrationDate: { type: Date, default: Date.now, required: true },
    otpId: { type: mongoose.Schema.Types.ObjectId, ref: "OTP", default: null },
    otpVerifiedAt: { type: Date, default: null },
    paymentTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
    paymentInitiatedAt: { type: Date, default: null },
    paymentCompletedAt: { type: Date, default: null },
    registrationCompletedAt: { type: Date, default: null },
    checkedInAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, trim: true, maxlength: 500 },
    failureReason: { type: String, trim: true, maxlength: 500 },
    paymentAmount: { type: Number, required: true, min: 0, default: 0 },
    paymentCurrency: { type: String, required: true, trim: true, uppercase: true, minlength: 3, maxlength: 3, default: "INR" },
}, {
    timestamps: true,
    versionKey: false,
});

registrationSchema.index({ eventId: 1, studentId: 1 }, { unique: true });
registrationSchema.index({ enrollmentNumber: 1, eventId: 1 });
registrationSchema.index({ studentId: 1, registrationDate: -1 });
registrationSchema.index({ eventId: 1, status: 1, paymentStatus: 1 });
registrationSchema.index({ paymentTransactionId: 1 });

registrationSchema.pre("validate", function () {
    if (this.status === "cancelled" && !this.cancelledAt) {
        this.cancelledAt = new Date();
    }

    if (this.status !== "cancelled") {
        this.cancelledAt = null;
        this.cancellationReason = undefined;
    }

    if (this.status === "registered" && !this.registrationCompletedAt) {
        this.registrationCompletedAt = new Date();
    }

    if (this.status === "failed" && !this.failureReason) {
        this.failureReason = "Registration failed";
    }

    if (this.paymentStatus === "success" && !this.paymentCompletedAt) {
        this.paymentCompletedAt = new Date();
    }
});

export const Registration = mongoose.model<IRegistration, IRegistrationSchema>("Registration", registrationSchema);