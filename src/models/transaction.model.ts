import mongoose from "mongoose";

const TRANSACTION_STATUSES = ["initiated", "pending", "success", "failed", "cancelled", "refunded"] as const;
const PAYMENT_SERVICES = ["dynamic_qr_service", "manual"] as const;

type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
type PaymentService = (typeof PAYMENT_SERVICES)[number];

interface ITransaction {
    registrationId: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    service: PaymentService;
    status: TransactionStatus;
    amount: number;
    currency: string;
    qrReferenceId?: string;
    qrGeneratedAt?: Date | null;
    paymentReference?: string;
    bankReference?: string;
    payerUpiId?: string;
    qrCodeData?: string;
    qrImageUrl?: string;
    referenceNote?: string;
    failureReason?: string;
    method?: string;
    notes?: string;
    providerResponse?: unknown;
    initiatedAt: Date;
    completedAt?: Date | null;
    refundedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type ITransactionSchema = mongoose.Model<ITransaction> & {};

const transactionSchema = new mongoose.Schema<ITransaction>(
    {
        registrationId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Registration" },
        eventId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Event" },
        studentId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Student" },
        service: {
            type: String,
            enum: PAYMENT_SERVICES,
            default: "dynamic_qr_service",
            required: true,
        },
        status: {
            type: String,
            enum: TRANSACTION_STATUSES,
            default: "initiated",
            required: true,
        },
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, trim: true, uppercase: true, minlength: 3, maxlength: 3, default: "INR" },
        qrReferenceId: { type: String, trim: true, index: { unique: true, sparse: true } },
        qrGeneratedAt: { type: Date, default: null },
        paymentReference: { type: String, trim: true, index: { unique: true, sparse: true } },
        bankReference: { type: String, trim: true, index: { unique: true, sparse: true } },
        payerUpiId: { type: String, trim: true, maxlength: 120 },
        qrCodeData: { type: String, trim: true },
        qrImageUrl: { type: String, trim: true, maxlength: 500 },
        referenceNote: { type: String, trim: true, maxlength: 120 },
        failureReason: { type: String, trim: true, maxlength: 500 },
        method: { type: String, trim: true, maxlength: 50 },
        notes: { type: String, trim: true, maxlength: 500 },
        providerResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
        initiatedAt: { type: Date, required: true, default: Date.now },
        completedAt: { type: Date, default: null },
        refundedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

transactionSchema.index({ registrationId: 1, status: 1 });
transactionSchema.index({ eventId: 1, studentId: 1, createdAt: -1 });
transactionSchema.index({ service: 1, status: 1 });

transactionSchema.pre("validate", function () {
    if (this.status === "success" && !this.completedAt) {
        this.completedAt = new Date();
    }

    if (this.status === "refunded" && !this.refundedAt) {
        this.refundedAt = new Date();
    }
});

export const Transaction = mongoose.model<ITransaction, ITransactionSchema>("Transaction", transactionSchema);
