import { Job } from 'bullmq';

type QueueHandler<T> = (job: Job<T>) => Promise<void>;

export const queueHandler = <T>(handler: QueueHandler<T>): QueueHandler<T> => {
    return async (job) => {
        try {
            await handler(job);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            await job.log(`Queue handler failed for job ${job.name} (${job.id}): ${errorMessage}`);
            throw error;
        }
    };
};