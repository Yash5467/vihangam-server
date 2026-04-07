import mongoose from "mongoose";

interface IBadge {
    clanId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    image?: string;
    price: number;
    currency: string;
    stock: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type IBadgeSchema = mongoose.Model<IBadge> & {};

const badgeSchema = new mongoose.Schema<IBadge>(
    {
        clanId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Clan", unique: true },
        name: { type: String, required: true, trim: true, maxlength: 120 },
        description: { type: String, trim: true, maxlength: 500, default: "" },
        image: { type: String, trim: true, maxlength: 500, default: "" },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, trim: true, uppercase: true, minlength: 3, maxlength: 3, default: "INR" },
        stock: { type: Number, required: true, min: 0, default: 0 },
        isActive: { type: Boolean, required: true, default: true },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

badgeSchema.index({ clanId: 1, isActive: 1 });

export const Badge = mongoose.model<IBadge, IBadgeSchema>("Badge", badgeSchema);