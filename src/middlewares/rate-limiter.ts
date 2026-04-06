
 import { RateLimiterRedis } from "rate-limiter-flexible";
import { asyncHandler } from "@/middlewares/error.js";
import HttpError, { isRateLimiterError } from "@/utils/errorHandler.js";
import redisClient from "@/lib/redis.js";


type RateLimiterParams = {
  points?: number;
  duration?: number;
  blockDuration?: number;
  keyPrefix?: string;
};


const rateLimiter = ({
  points = 5,
  duration = 60,
  blockDuration = 60,
  keyPrefix = "routeLimiter",
}: RateLimiterParams = {}) => {
  const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points,
    duration,
    blockDuration,
    keyPrefix,
  });

  return asyncHandler(async (req, res, next) => {
    try {
      const ip = req.ip;
      if (!ip) throw new HttpError(400, "Invalid");
      const key = `${ip}:${req.path}`;
      await rateLimiter.consume(key);
      next();
    } catch (err) {
      if (isRateLimiterError(err)) {
        res.set("Retry-After", String(Math.ceil(err.msBeforeNext / 1000)));
        return res.status(429).json({ message: "Too Many Requests" });
      }

      throw err;
    }
  });
};


export { rateLimiter };

