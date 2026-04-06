import { z } from "zod";

export const studentClanControllerValidator = z.object({
    enrollmentNumber: z.string().min(1, "Enrollment number is required"),
})