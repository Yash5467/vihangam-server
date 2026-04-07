import { asyncHandler } from "@/middlewares/error.js";
import { BadgeOrder } from "@/models/badge-order.model.js";
import { Badge } from "@/models/badge.model.js";
import { BadgeOrderQueue } from "@/queue/order/badge-order.queue.js";
import { CustomRequest } from "@/types/types.js";
import { ApiResponse } from "@/utils/responseHandler.js";
import logger from "@/utils/logger.js";
import mongoose from "mongoose";



export const transactionEKQRHookController = asyncHandler(
    async (req: CustomRequest, res) => {
        const paymentData = req.body;

        logger.info("Badge payment webhook received", {
            status: paymentData?.status,
            orderId: paymentData?.udf1,
            amount: paymentData?.amount,
            transactionId: paymentData?.client_txn_id,
            bankReference: paymentData?.bank_ref_num,
        });

        if (req.body.status === 'success') {
            const session = await mongoose.startSession();
            session.startTransaction();

            const order = await BadgeOrder.findByIdAndUpdate(paymentData.udf1, {
                orderStatus: 'paid',
                paymentStatus: 'success',
                paymentDetails: { ...paymentData }
            });

            if (!order) {
                logger.warn("Badge order not found for successful payment webhook", {
                    orderId: paymentData.udf1,
                    transactionId: paymentData?.client_txn_id,
                });
                return;
            }

            logger.info("Badge order marked as paid", {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                studentId: order.studentId.toString(),
                clanId: order.clanId.toString(),
                amount: order.totalAmount,
            });

            await Badge.findByIdAndUpdate(order?.badgeId, {
                $inc: { stock: -order?.quantity }
            }, {
                session: session
            });

            logger.info("Badge stock updated after successful payment", {
                orderId: paymentData.udf1,
                badgeId: order?.badgeId?.toString?.() || null,
                quantityDeducted: order?.quantity,
            });

            await session.commitTransaction();
            session.endSession();
            logger.info("Badge payment transaction committed", {
                orderId: paymentData.udf1,
                status: paymentData.status,
            });
            await BadgeOrderQueue.add("process-badge-order", {
                orderId: paymentData.udf1
            });

            logger.info("Badge order processing job queued", {
                orderId: paymentData.udf1,
                queueName: "badge-order-queue",
                jobName: "process-badge-order",
            });
        }
        else if (req.body.status === 'failure') {
            const session = await mongoose.startSession();
            session.startTransaction();

            await BadgeOrder.findByIdAndUpdate(paymentData.udf1, {
                orderStatus: 'failed',
                paymentStatus: 'failure',
                paymentDetails: { ...paymentData }
            });

            logger.warn("Badge payment webhook marked failed", {
                orderId: paymentData.udf1,
                transactionId: paymentData?.client_txn_id,
                failureReason: paymentData?.status_msg || paymentData?.reason || paymentData?.error || "Payment failure",
            });

            await session.commitTransaction();
            session.endSession();

            logger.info("Badge failure transaction committed", {
                orderId: paymentData.udf1,
                status: paymentData.status,
            });
        }

        return res.status(200).json(new ApiResponse(null, "Transaction status updated successfully", 200));
    }
)