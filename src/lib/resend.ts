import "dotenv/config"
import { Resend } from "resend"

export const resendClient = new Resend(process.env.RESEND_API_KEY as string)