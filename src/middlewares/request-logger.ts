import { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import logger from "@/utils/logger.js";

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header("x-request-id") || randomUUID();
  const startedAt = process.hrtime.bigint();

  res.setHeader("x-request-id", requestId);
  res.locals.requestId = requestId;

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger.log({
      level,
      message: "HTTP request completed",
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.get("user-agent"),
      contentLength: res.getHeader("content-length"),
    });
  });

  next();
};