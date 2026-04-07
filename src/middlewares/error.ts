
import { NextFunction, Request, Response } from "express";
import HttpError from "@/utils/errorHandler.js";
import { envMode } from "@/app.js";
import logger from "@/utils/logger.js";

export const errorMiddleware = (
  err: HttpError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {

  err.message ||= "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  const response: {
    success: boolean,
    message: string,
    error?: HttpError
  } = {
    success: false,
    message: err.message,
  };

  const requestId = (res.locals as { requestId?: string }).requestId;

  logger.error("Request failed", {
    requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode,
    message: err.message,
    stack: err.stack,
  });

  if (envMode === "DEVELOPMENT") {
    response.error = err;
  }

  return res.status(err.statusCode).json(response);

};

type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<unknown, Record<string, unknown>>>;

export const asyncHandler = (passedFunc: ControllerType) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await passedFunc(req, res, next);
  } catch (error) {
    logger.error("Controller error", {
      method: req.method,
      url: req.originalUrl,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    next(error);
  }
};

