import redisClient from "@/lib/redis.js";
import { IBadgeOrderJobData } from "@/workers/order/badge.order.queue.worker.js";
import { Queue } from "bullmq";



export const BadgeOrderQueue = new Queue<IBadgeOrderJobData>("badge-order-queue", {
    connection: redisClient,
    defaultJobOptions: {
        removeOnComplete: true,
    }
});