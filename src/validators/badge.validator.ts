import { z } from "zod";

export const viewBadgeDetailsValidator = z.object({
    badgeId: z.string().trim().min(1, "Enrollment number is required"),
});

export const orderBadgeValidator = z.object({
    enrollmentNumber: z.string().trim().min(1, "Enrollment number is required"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(10, "You can order up to 10 badges at once"),
    notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
    phoneNumber: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15, "Phone number cannot exceed 15 digits").optional(),
    badgeId: z.string().trim().min(1, "Badge ID is required"),
});