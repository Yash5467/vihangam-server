import { studentClanController, studentLookupController } from "@/controllers/student.controller.js";
import { validateRequestMiddleware } from "@/middlewares/validate-request-middleware.js";
import { studentClanControllerValidator } from "@/validators/student.validator.js";
import { Router } from "express";



export const studentRouter=Router();

studentRouter.get("/clan",validateRequestMiddleware(studentClanControllerValidator),studentClanController);
studentRouter.get("/lookup",validateRequestMiddleware(studentClanControllerValidator),studentLookupController);