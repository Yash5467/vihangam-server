import {
    eventDetailsController,
    eventListController,
    hotEventsController,
    recommendedEventsController,
} from "@/controllers/event.controller.js";
import { validateRequestMiddleware } from "@/middlewares/validate-request-middleware.js";
import {
    eventDetailsValidator,
    eventListValidator,
} from "@/validators/event.validator.js";
import { Router } from "express";

export const eventRouter = Router();

eventRouter.get("/list", validateRequestMiddleware(eventListValidator), eventListController);
eventRouter.get("/details", validateRequestMiddleware(eventDetailsValidator), eventDetailsController);
eventRouter.get("/recommended", validateRequestMiddleware(eventListValidator), recommendedEventsController);
eventRouter.get("/hot", validateRequestMiddleware(eventListValidator), hotEventsController);
