import { Badge } from "@/models/badge.model.js";
import { BadgeOrder } from "@/models/badge-order.model.js";
import { Clan } from "@/models/clan.model.js";
import logger from "@/utils/logger.js";
import { resendClient } from "@/lib/resend.js";
import { queueHandler } from "@/utils/queueHandler.js";
import { Worker } from "bullmq";
import { Student } from "@/models/student.model.js";
import redisClient from "@/lib/redis.js";

export interface IBadgeOrderJobData {
    orderId: string;
}

logger.info("Badge order queue worker starting", { queueName: "badge-order-queue" });


new Worker(
    "badge-order-queue",
    queueHandler<IBadgeOrderJobData>(async (job) => {
        logger.info("Badge order job received", {
            queueName: job.queueName,
            jobId: job.id,
            orderId: job.data.orderId,
        });

        const order = await BadgeOrder.findById(job.data.orderId).lean();

        if (!order)
            throw new Error(`Badge order not found for job ${job.id}`);


        const [student, badge, clan] = await Promise.all([
            Student.findById(order.studentId).lean(),
            Badge.findOne({ clanId: order.clanId }).lean(),
            Clan.findById(order.clanId).lean(),
        ]);

        if (!student)
            throw new Error(`Student not found for badge order ${order._id}`);


        if (!badge)
            throw new Error(`Badge not found for badge order ${order._id}`);


        if (!student.email)
            throw new Error(`Student email is missing for badge order ${order._id}`);


        await resendClient.emails.send({
            from: process.env.RESEND_FROM_EMAIL as string,
            to: student.email,
            subject: `Badge order Successful for ${badge.name}`,
            template: {
                id: process.env.RESEND_BADGE_ORDER_TEMPLATE_ID as string,
                variables: {
                    order_id: order._id.toString(),
                    order_number: order.orderNumber,
                    student_name: student.name,
                    student_email: student.email,
                    enrollment_number: student.enrollmentNumber,
                    clan_name: clan?.name || "",
                    clan_image: clan?.image || "",
                    badge_name: badge.name,
                    badge_description: badge.description || "",
                    badge_image: badge.image || "",
                    quantity: order.quantity,
                    unit_price: order.unitPrice,
                    total_amount: order.totalAmount,
                    currency: order.currency,
                },
            },
        });

        logger.info("Badge order email sent", {
            queueName: job.queueName,
            jobId: job.id,
            orderId: order._id.toString(),
            studentEmail: student.email,
            badgeName: badge.name,
        });
    }),
    {
        connection:redisClient
    }
);