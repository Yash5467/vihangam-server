import { asyncHandler } from "@/middlewares/error.js";
import { Event } from "@/models/event.model.js";
import { CustomRequest } from "@/types/types.js";
import { ApiError, ApiResponse } from "@/utils/responseHandler.js";
import { eventDetailsValidator, eventListValidator } from "@/validators/event.validator.js";
import z from "zod";

const UPCOMING_EVENT_STATUSES = ["upcoming", "ongoing"] as const;


export const eventListController = asyncHandler(
    async (req: CustomRequest<z.infer<typeof eventListValidator>>, res) => {
        const page = req.validatedBody?.page ?? 1;
        const search = req.validatedBody?.search?.trim();

        const query: Record<string, unknown> = {
            status: { $in: UPCOMING_EVENT_STATUSES },
        };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { venue: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const [events] = await Promise.all([
            Event.find(query)
                .sort({ date: 1, createdAt: -1 })
                .skip(Number((page - 1) * 10))
                .limit(10)
                .lean(),
        ]);

        return res.status(200).json(new ApiResponse(events, "Event list retrieved successfully", 200));
    }
);

export const eventDetailsController = asyncHandler(
    async (req: CustomRequest<z.infer<typeof eventDetailsValidator>>, res) => {
        const event = await Event.findById(req.validatedBody!.eventId);

        if (!event) {
            return res.status(404).json(new ApiError(404, "Event not found"));
        }

        return res.status(200).json(new ApiResponse(event, "Event details retrieved successfully", 200));
    }
);

export const recommendedEventsController = asyncHandler(
    async (req: CustomRequest<z.infer<typeof eventListValidator>>, res) => {
        const page = req.validatedBody?.page ?? 1;
        const search = req.validatedBody?.search?.trim();

        const query: Record<string, unknown> = {
            status: { $in: UPCOMING_EVENT_STATUSES },
        };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { venue: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const [events] = await Promise.all([
            Event.find(query)
                .sort({ clanPoints: -1, date: 1, createdAt: -1 })
                .skip(Number((page - 1) * 10))
                .limit(10)
                .lean(),
        ]);

        return res.status(200).json(new ApiResponse(events, "Recommended events retrieved successfully", 200));
    }
);

export const hotEventsController = asyncHandler(
    async (req: CustomRequest<z.infer<typeof eventListValidator>>, res) => {
        const page = req.validatedBody?.page ?? 1;
        const search = req.validatedBody?.search?.trim();

        const query: Record<string, unknown> = {
            status: { $in: UPCOMING_EVENT_STATUSES },
        };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { venue: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const [events] = await Promise.all([
            Event.find(query)
                .sort({ spotsAvailable: 1, clanPoints: -1, date: 1, createdAt: -1 })
                .skip(Number((page - 1) * 10))
                .limit(10)
                .lean(),
        ]);

        return res.status(200).json(new ApiResponse(events, "Hot events retrieved successfully", 200));
    }
);
