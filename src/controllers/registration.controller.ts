import mongoose from "mongoose";
import { asyncHandler } from "@/middlewares/error.js";
import { OTP } from "@/models/otp.model.js";
import { Registration } from "@/models/registration.model.js";
import { Student } from "@/models/student.model.js";
import { Transaction } from "@/models/transaction.model.js";
import { CustomRequest } from "@/types/types.js";
import { ApiError, ApiResponse } from "@/utils/responseHandler.js";
import {
    eventRegistrationConfirmPaymentValidator,
    eventRegistrationInitiatePaymentValidator,
    eventRegistrationResendOtpValidator,
    eventRegistrationStartValidator,
    eventRegistrationVerifyOtpValidator,
} from "@/validators/event.validator.js";
import { Event } from "@/models/event.model.js";
import z from "zod";

const ACTIVE_REGISTRATION_STATUSES = ["otp_sent", "otp_verified", "payment_pending", "registered"] as const;
const UPCOMING_EVENT_STATUSES = ["upcoming", "ongoing"] as const;

const findStudentByEnrollmentNumber = async (enrollmentNumber: string) => {
    return Student.findOne({
        enrollmentNumber: {
            $regex: new RegExp(`^${enrollmentNumber.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
        },
    });
};

export const startEventRegistrationController = asyncHandler(
    async (req: CustomRequest<z.infer<typeof eventRegistrationStartValidator>>, res) => {
        const enrollmentNumber = req.validatedBody!.enrollmentNumber.trim();
        const event = await Event.findById(req.validatedBody!.eventId);

        if (!event) {
            return res.status(404).json(new ApiError(404, "Event not found"));
        }

        if (!UPCOMING_EVENT_STATUSES.includes(event.status as (typeof UPCOMING_EVENT_STATUSES)[number])) {
            return res.status(400).json(new ApiError(400, "Registration is closed for this event"));
        }

        const student = await findStudentByEnrollmentNumber(enrollmentNumber);

        if (!student) {
            return res.status(404).json(new ApiError(404, "Student not found"));
        }

        const activeRegistrations = await Registration.countDocuments({
            eventId: event._id,
            status: { $in: ACTIVE_REGISTRATION_STATUSES },
        });

        if (activeRegistrations >= event.spotsAvailable) {
            return res.status(409).json(new ApiError(409, "Event seats are full"));
        }

        let registration = await Registration.findOne({ eventId: event._id, studentId: student._id });

        if (!registration) {
            registration = new Registration({
                enrollmentNumber: student.enrollmentNumber,
                eventId: event._id,
                studentId: student._id,
                status: "otp_sent",
                paymentStatus: event.registrationAmount > 0 ? "pending" : "not_required",
                paymentAmount: event.registrationAmount,
                paymentCurrency: "INR",
                registrationDate: new Date(),
            });
        } else {
            registration.enrollmentNumber = student.enrollmentNumber;
            registration.status = "otp_sent";
            registration.paymentStatus = event.registrationAmount > 0 ? "pending" : "not_required";
            registration.paymentAmount = event.registrationAmount;
            registration.paymentCurrency = "INR";
            registration.otpVerifiedAt = null;
            registration.paymentInitiatedAt = null;
            registration.paymentCompletedAt = null;
            registration.registrationCompletedAt = null;
            registration.cancelledAt = null;
            registration.cancellationReason = undefined;
            registration.failureReason = undefined;
        }

        await registration.save();

        // TODO: enqueue OTP request here using your Resend + queue implementation.

        return res.status(200).json(
            new ApiResponse(
                {
                    registrationId: registration._id,
                    eventId: event._id,
                    studentId: student._id,
                    enrollmentNumber: student.enrollmentNumber,
                    status: registration.status,
                    paymentStatus: registration.paymentStatus,
                },
                "OTP request queued successfully",
                200
            )
        );
    }
);

export const resendEventRegistrationOtpController = asyncHandler(
    async (req: CustomRequest<z.infer<typeof eventRegistrationResendOtpValidator>>, res) => {
        const registration = await Registration.findById(req.validatedBody!.registrationId);

        if (!registration) {
            return res.status(404).json(new ApiError(404, "Registration not found"));
        }

        if (registration.status === "registered") {
            return res.status(400).json(new ApiError(400, "Registration is already completed"));
        }

        if (registration.status === "cancelled") {
            return res.status(400).json(new ApiError(400, "Cannot resend OTP for a cancelled registration"));
        }

        registration.status = "otp_sent";
        await registration.save();

        // TODO: enqueue OTP resend request here using your Resend + queue implementation.

        return res.status(200).json(new ApiResponse({ registrationId: registration._id, status: registration.status }, "OTP resend requested successfully", 200));
    }
);

export const verifyEventRegistrationOtpController = asyncHandler(
    async (req: CustomRequest<z.infer<typeof eventRegistrationVerifyOtpValidator>>, res) => {
        const registration = await Registration.findById(req.validatedBody!.registrationId);

        if (!registration) {
            return res.status(404).json(new ApiError(404, "Registration not found"));
        }

        const otp = await OTP.findOne({
            studentId: registration.studentId,
            eventId: registration.eventId,
            purpose: "event_registration",
            otp: req.validatedBody!.otp,
            isUsed: false,
        }).sort({ createdAt: -1 });

        if (!otp) {
            return res.status(400).json(new ApiError(400, "Invalid or expired OTP"));
        }

        otp.isUsed = true;
        otp.usedAt = new Date();

        registration.otpId = otp._id;
        registration.otpVerifiedAt = new Date();
        registration.status = registration.paymentAmount > 0 ? "otp_verified" : "registered";
        registration.paymentStatus = registration.paymentAmount > 0 ? "pending" : "not_required";

        if (registration.paymentAmount === 0) {
            registration.registrationCompletedAt = new Date();
        }

        await Promise.all([otp.save(), registration.save()]);

        return res.status(200).json(
            new ApiResponse(
                {
                    registrationId: registration._id,
                    status: registration.status,
                    paymentStatus: registration.paymentStatus,
                },
                "OTP verified successfully",
                200
            )
        );
    }
);

export const initiateEventRegistrationPaymentController = asyncHandler(
    async (req: CustomRequest<z.infer<typeof eventRegistrationInitiatePaymentValidator>>, res) => {
        const registration = await Registration.findById(req.validatedBody!.registrationId);

        if (!registration) {
            return res.status(404).json(new ApiError(404, "Registration not found"));
        }

        if (registration.paymentAmount <= 0) {
            return res.status(400).json(new ApiError(400, "Payment is not required for this registration"));
        }

        if (registration.status !== "otp_verified" && registration.status !== "payment_pending") {
            return res.status(400).json(new ApiError(400, "OTP verification is required before payment"));
        }

        let transaction = registration.paymentTransactionId
            ? await Transaction.findById(registration.paymentTransactionId)
            : await Transaction.findOne({ registrationId: registration._id }).sort({ createdAt: -1 });

        if (!transaction) {
            transaction = new Transaction({
                registrationId: registration._id,
                eventId: registration.eventId,
                studentId: registration.studentId,
                service: "dynamic_qr_service",
                status: "initiated",
                amount: registration.paymentAmount,
                currency: registration.paymentCurrency,
                qrReferenceId: new mongoose.Types.ObjectId().toString(),
                qrGeneratedAt: new Date(),
                referenceNote: `Event registration payment for ${registration.enrollmentNumber}`,
            });
        }

        transaction.status = "pending";
        transaction.amount = registration.paymentAmount;
        transaction.currency = registration.paymentCurrency;

        // TODO: generate dynamic QR payload from your QR service here and attach qrCodeData / qrImageUrl.

        await transaction.save();

        registration.paymentTransactionId = transaction._id;
        registration.paymentInitiatedAt = registration.paymentInitiatedAt || new Date();
        registration.paymentStatus = "pending";
        registration.status = "payment_pending";
        await registration.save();

        return res.status(200).json(
            new ApiResponse(
                {
                    registrationId: registration._id,
                    transactionId: transaction._id,
                    service: transaction.service,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    qrReferenceId: transaction.qrReferenceId,
                    qrGeneratedAt: transaction.qrGeneratedAt,
                    qrCodeData: transaction.qrCodeData,
                    qrImageUrl: transaction.qrImageUrl,
                    referenceNote: transaction.referenceNote,
                },
                "Payment initiated successfully",
                200
            )
        );
    }
);

export const confirmEventRegistrationPaymentController = asyncHandler(
    async (req: CustomRequest<z.infer<typeof eventRegistrationConfirmPaymentValidator>>, res) => {
        const registration = await Registration.findById(req.validatedBody!.registrationId);

        if (!registration) {
            return res.status(404).json(new ApiError(404, "Registration not found"));
        }

        if (registration.paymentAmount <= 0) {
            return res.status(400).json(new ApiError(400, "Payment confirmation is not required for this registration"));
        }

        const transaction = registration.paymentTransactionId
            ? await Transaction.findById(registration.paymentTransactionId)
            : await Transaction.findOne({ registrationId: registration._id }).sort({ createdAt: -1 });

        if (!transaction) {
            return res.status(404).json(new ApiError(404, "Payment transaction not found"));
        }

        transaction.status = "success";
        transaction.paymentReference = req.validatedBody!.paymentReference;
        transaction.bankReference = req.validatedBody!.bankReference;
        transaction.payerUpiId = req.validatedBody!.payerUpiId;
        transaction.method = transaction.method || "dynamic_qr";
        transaction.notes = req.validatedBody!.notes || transaction.notes;
        transaction.completedAt = transaction.completedAt || new Date();

        registration.paymentTransactionId = transaction._id;
        registration.paymentCompletedAt = new Date();
        registration.registrationCompletedAt = new Date();
        registration.paymentStatus = "success";
        registration.status = "registered";
        registration.failureReason = undefined;

        await Promise.all([transaction.save(), registration.save()]);

        return res.status(200).json(
            new ApiResponse(
                {
                    registrationId: registration._id,
                    transactionId: transaction._id,
                    status: registration.status,
                    paymentStatus: registration.paymentStatus,
                },
                "Registration completed successfully",
                200
            )
        );
    }
);