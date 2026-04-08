import { badgeListController, orderBadgeController, viewBadgeDetailsController } from "@/controllers/badge.controller.js";
import { rateLimiter } from "@/middlewares/rate-limiter.js";
import { validateRequestMiddleware } from "@/middlewares/validate-request-middleware.js";
import { orderBadgeValidator, viewBadgeDetailsValidator } from "@/validators/badge.validator.js";
import { Router } from "express";

export const badgeRouter = Router();

badgeRouter.get("/details", validateRequestMiddleware(viewBadgeDetailsValidator), viewBadgeDetailsController);
badgeRouter.post("/order",
    rateLimiter({
        points: 8,
        duration: 5 * 60,
        blockDuration: 5 * 60,
        keyPrefix: "badgeOrder5MinLimiter",
    }),
    rateLimiter({
        points: 10,
        duration: 10 * 60,
        blockDuration: 10 * 60,
        keyPrefix: "badgeOrder10MinLimiter",
    }),
    rateLimiter({
        points: 15,
        duration: 60 * 60,
        blockDuration: 60 * 60,
        keyPrefix: "badgeOrderHourLimiter",
    }),
    rateLimiter({
        points: 30,
        duration: 24 * 60 * 60,
        blockDuration: 24 * 60 * 60,
        keyPrefix: "badgeOrderDayLimiter",
    }),
    validateRequestMiddleware(orderBadgeValidator), orderBadgeController);
badgeRouter.get("/list", badgeListController);