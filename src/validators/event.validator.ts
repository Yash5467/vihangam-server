import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const eventListValidator = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	search: z.string().trim().optional(),
});

export const eventDetailsValidator = z.object({
	eventId: objectIdSchema,
});

export const eventRegistrationStartValidator = z.object({
	enrollmentNumber: z.string().trim().min(1, "Enrollment number is required"),
	eventId: objectIdSchema,
});

export const eventRegistrationResendOtpValidator = z.object({
	registrationId: objectIdSchema,
});

export const eventRegistrationVerifyOtpValidator = z.object({
	registrationId: objectIdSchema,
	otp: z.string().trim().regex(/^\d{4,8}$/, "OTP must be 4 to 8 digits"),
});

export const eventRegistrationInitiatePaymentValidator = z.object({
	registrationId: objectIdSchema,
});

export const eventRegistrationConfirmPaymentValidator = z.object({
	registrationId: objectIdSchema,
	paymentReference: z.string().trim().min(1, "Payment reference is required"),
	bankReference: z.string().trim().optional(),
	payerUpiId: z.string().trim().optional(),
	notes: z.string().trim().optional(),
});


