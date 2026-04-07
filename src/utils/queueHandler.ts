import logger from "@/utils/logger.js";
import { Job } from 'bullmq';

type QueueHandler<T> = (job: Job<T>) => Promise<void>;

export const queueHandler = <T>(handler: QueueHandler<T>): QueueHandler<T> => {
    return async (job) => {
        try {
            await handler(job);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            logger.error("Queue job failed", {
                queueName: job.queueName,
                jobName: job.name,
                jobId: job.id,
                error: errorMessage,
            });
            await job.log(`Queue handler failed for job ${job.name} (${job.id}): ${errorMessage}`);
            throw error;
        }
    };
};