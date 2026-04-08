import { transactionEKQRHookController, transactionStatusController } from "@/controllers/transaction.controller.js";
import { validateRequestMiddleware } from "@/middlewares/validate-request-middleware.js";
import { transactionStatusControllerValidator } from "@/validators/transaction.validator.js";
import { Router } from "express";


export const transactionRouter = Router();

transactionRouter.post("/ekqr-hook", transactionEKQRHookController);
transactionRouter.get("/status", validateRequestMiddleware(transactionStatusControllerValidator), transactionStatusController);