import { transactionEKQRHookController } from "@/controllers/transaction.controller.js";
import { Router } from "express";


export const transactionRouter = Router();

transactionRouter.post("/ekqr-hook",transactionEKQRHookController);