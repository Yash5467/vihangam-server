import z from "zod";



export const transactionStatusControllerValidator = z.object({
    transactionId: z.string({
        message: "Transaction ID is required and must be a string"
    }).min(1, "Transaction ID cannot be empty")
})