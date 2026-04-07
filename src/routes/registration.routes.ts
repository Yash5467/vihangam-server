import {
    confirmEventRegistrationPaymentController,
    initiateEventRegistrationPaymentController,
    resendEventRegistrationOtpController,
    startEventRegistrationController,
    verifyEventRegistrationOtpController,
} from "@/controllers/registration.controller.js";
import { validateRequestMiddleware } from "@/middlewares/validate-request-middleware.js";
import {
    eventRegistrationConfirmPaymentValidator,
    eventRegistrationInitiatePaymentValidator,
    eventRegistrationResendOtpValidator,
    eventRegistrationStartValidator,
    eventRegistrationVerifyOtpValidator,
} from "@/validators/event.validator.js";
import { Router } from "express";

export const registrationRouter = Router();

registrationRouter.post("/start", validateRequestMiddleware(eventRegistrationStartValidator), startEventRegistrationController);
registrationRouter.post("/resend-otp", validateRequestMiddleware(eventRegistrationResendOtpValidator), resendEventRegistrationOtpController);
registrationRouter.post("/verify-otp", validateRequestMiddleware(eventRegistrationVerifyOtpValidator), verifyEventRegistrationOtpController);
registrationRouter.post("/payment/initiate", validateRequestMiddleware(eventRegistrationInitiatePaymentValidator), initiateEventRegistrationPaymentController);
registrationRouter.post("/payment/confirm", validateRequestMiddleware(eventRegistrationConfirmPaymentValidator), confirmEventRegistrationPaymentController);