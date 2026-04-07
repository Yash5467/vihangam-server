import mongoose from "mongoose";

const BADGE_ORDER_STATUSES = ["created", "payment_pending", "paid", "cancelled", "failed", "refunded", "fulfilled"] as const;
const BADGE_PAYMENT_STATUSES = ["pending", "success", "failed", "refunded"] as const;

type BadgeOrderStatus = (typeof BADGE_ORDER_STATUSES)[number];
type BadgePaymentStatus = (typeof BADGE_PAYMENT_STATUSES)[number];

interface IBadgeOrder {
    badgeId: mongoose.Types.ObjectId;
    orderNumber: string;
    studentId: mongoose.Types.ObjectId;
    clanId: mongoose.Types.ObjectId;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    currency: string;
    orderStatus: BadgeOrderStatus;
    paymentStatus: BadgePaymentStatus;
    paymentMethod?: string;
    paymentReference?: string;
    bankReference?: string;
    payerUpiId?: string;
    failureReason?: string;
    notes?: string;
    providerResponse?: unknown;
    paymentInitiatedAt?: Date | null;
    paidAt?: Date | null;
    cancelledAt?: Date | null;
    fulfilledAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type IBadgeOrderSchema = mongoose.Model<IBadgeOrder> & {};

const badgeOrderSchema = new mongoose.Schema<IBadgeOrder>(
    {
        badgeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Badge" },
        orderNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
        studentId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Student" },
        clanId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Clan" },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, trim: true, uppercase: true, minlength: 3, maxlength: 3, default: "INR" },
        orderStatus: {
            type: String,
            enum: BADGE_ORDER_STATUSES,
            default: "created",
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: BADGE_PAYMENT_STATUSES,
            default: "pending",
            required: true,
        },
        paymentMethod: { type: String, trim: true, maxlength: 50 },
        paymentReference: { type: String, trim: true, index: { unique: true, sparse: true } },
        bankReference: { type: String, trim: true, index: { unique: true, sparse: true } },
        payerUpiId: { type: String, trim: true, maxlength: 120 },
        failureReason: { type: String, trim: true, maxlength: 500 },
        notes: { type: String, trim: true, maxlength: 500 },
        providerResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
        paymentInitiatedAt: { type: Date, default: null },
        paidAt: { type: Date, default: null },
        cancelledAt: { type: Date, default: null },
        fulfilledAt: { type: Date, default: null },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

badgeOrderSchema.index({ studentId: 1, createdAt: -1 });
badgeOrderSchema.index({ clanId: 1, orderStatus: 1 });
badgeOrderSchema.index({ paymentStatus: 1, orderStatus: 1 });

badgeOrderSchema.pre("validate", function () {
    this.totalAmount = this.quantity * this.unitPrice;

    if (this.paymentStatus === "success") {
        this.orderStatus = this.orderStatus === "fulfilled" ? "fulfilled" : "paid";

        if (!this.paidAt) {
            this.paidAt = new Date();
        }
    }

    if (this.paymentStatus === "failed") {
        this.orderStatus = "failed";
    }

    if (this.paymentStatus === "refunded") {
        this.orderStatus = "refunded";
    }

    if (this.orderStatus === "cancelled" && !this.cancelledAt) {
        this.cancelledAt = new Date();
    }
});

export const BadgeOrder = mongoose.model<IBadgeOrder, IBadgeOrderSchema>("BadgeOrder", badgeOrderSchema);