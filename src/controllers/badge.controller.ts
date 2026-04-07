import { asyncHandler } from "@/middlewares/error.js";
import { Badge } from "@/models/badge.model.js";
import { BadgeOrder } from "@/models/badge-order.model.js";
import { Student } from "@/models/student.model.js";
import { CustomRequest } from "@/types/types.js";
import { ApiError, ApiResponse } from "@/utils/responseHandler.js";
import { orderBadgeValidator, viewBadgeDetailsValidator } from "@/validators/badge.validator.js";
import z from "zod";
import mongoose from "mongoose";
import axios from "axios";

const createOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `BDG-${timestamp}-${random}`;
};

export const viewBadgeDetailsController = asyncHandler(
    async (req: CustomRequest<z.infer<typeof viewBadgeDetailsValidator>>, res) => {
        const [details] = await Badge.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(req.validatedBody!.badgeId) }
            },
            {
                $lookup: {
                    from: "clans",
                    localField: "clanId",
                    foreignField: "_id",
                    as: "clan"
                }
            },
            {
                $unwind: {
                    path: "$clan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1,
                    currency: 1,
                    stock: 1,
                    clanName: "$clan.name",
                    clanLogo: "$clan.image"
                }
            }
        ]);

        if (!details)
            return res.status(404).json(new ApiError(404, "Badge not found"));

        return res.status(200).json(new ApiResponse(details, "Badge details retrieved successfully", 200));

    }
);

export const orderBadgeController = asyncHandler(
    async (req: CustomRequest<z.infer<typeof orderBadgeValidator>>, res) => {
        const { enrollmentNumber, quantity, notes } = req.validatedBody!;

        const student = await Student.findOne({
            enrollmentNumber: enrollmentNumber
        });

        if (!student)
            return res.status(404).json(new ApiError(404, "Student not found"));


        if (!student.clanId)
            return res.status(400).json(new ApiError(400, "Student is not assigned to any clan"));


        const badge = await Badge.findById(req.validatedBody?.badgeId).lean();

        if (!badge)
            return res.status(404).json(new ApiError(404, "Badge not found for the student's clan"));


        if (badge.stock < quantity)
            return res.status(400).json(new ApiError(400, "Insufficient badge stock"));


        const order = await BadgeOrder.create({
            orderNumber: createOrderNumber(),
            studentId: student._id,
            clanId: student.clanId,
            quantity,
            unitPrice: badge.price,
            totalAmount: quantity * badge.price,
            currency: badge.currency,
            orderStatus: "payment_pending",
            paymentStatus: "pending",
            notes,
            paymentInitiatedAt: new Date(),
            badgeId: badge._id,
        });

        student.phoneNumber = req.validatedBody?.phoneNumber || student.phoneNumber;
        await student.save();

        const transaction = await axios.post("https://api.ekqr.in/api/create_order", {
            key: process.env.PAYMENT_KEY,
            amount: order.totalAmount,
            customer_name: student.name,
            customer_mobile: req.validatedBody?.phoneNumber || "",
            customer_email: student.email,
            udf1: order._id.toString(),
            redirect_url: `https://vihangam.clashx24.in/badges/payment/success`,
            client_txn_id: order._id,
            p_info: `Purchase of ${quantity} ${badge.name} badge(s) by ${student.name}`,
        });
        return res.status(201).json(
            new ApiResponse(
                transaction.data.data.payment_url,
                "Badge order created successfully. Proceed with payment.",
                201
            )
        );
    }
);

export const badgeListController = asyncHandler(
    async (req: CustomRequest, res) => {
        const list = await Badge.aggregate([
            {
                $match: { isActive: true }
            },
            {
                $lookup: {
                    from: "clans",
                    localField: "clanId",
                    foreignField: "_id",
                    as: "clan"
                }
            },
            {
                $unwind: {
                    path: "$clan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1,
                }
            }
        ]);

        return res.status(200).json(new ApiResponse(list, "Badge list retrieved successfully", 200));
    }
)