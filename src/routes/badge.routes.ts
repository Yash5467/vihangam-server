import { badgeListController, orderBadgeController, viewBadgeDetailsController } from "@/controllers/badge.controller.js";
import { validateRequestMiddleware } from "@/middlewares/validate-request-middleware.js";
import { orderBadgeValidator, viewBadgeDetailsValidator } from "@/validators/badge.validator.js";
import { Router } from "express";

export const badgeRouter = Router();

badgeRouter.get("/details", validateRequestMiddleware(viewBadgeDetailsValidator), viewBadgeDetailsController);
badgeRouter.post("/order", validateRequestMiddleware(orderBadgeValidator), orderBadgeController);
badgeRouter.get("/list", badgeListController);