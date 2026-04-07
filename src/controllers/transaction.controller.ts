import { asyncHandler } from "@/middlewares/error.js";
import { BadgeOrder } from "@/models/badge-order.model.js";
import { Badge } from "@/models/badge.model.js";
import { BadgeOrderQueue } from "@/queue/order/badge-order.queue.js";
import { CustomRequest } from "@/types/types.js";
import { ApiResponse } from "@/utils/responseHandler.js";
import mongoose from "mongoose";



export const transactionEKQRHookController = asyncHandler(
    async (req: CustomRequest, res) => {
        if (req.body.status === 'success') {
            const paymentData = req.body
            const session = await mongoose.startSession();
            session.startTransaction();

            const order = await BadgeOrder.findByIdAndUpdate(paymentData.udf1, {
                orderStatus: 'paid',
                paymentStatus: 'success',
                paymentDetails: { ...paymentData }
            });

            await Badge.findByIdAndUpdate(order?.badgeId, {
                $inc: { stock: -paymentData.quantity }
            });

            await session.commitTransaction();
            session.endSession();
            await BadgeOrderQueue.add("process-badge-order", {
                orderId: paymentData.udf1
            })
        }
        else if (req.body.status === 'failure') {

            const paymentData = req.body;
            const session = await mongoose.startSession();
            session.startTransaction();

            await BadgeOrder.findByIdAndUpdate(paymentData.udf1, {
                orderStatus: 'failed',
                paymentStatus: 'failure',
                paymentDetails: { ...paymentData }
            });
            await session.commitTransaction();
            session.endSession();
        }

        return res.status(200).json(new ApiResponse(null, "Transaction status updated successfully", 200));
    }
)