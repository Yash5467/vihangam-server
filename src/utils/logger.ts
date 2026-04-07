import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import winston from "winston";

const logsDir = join(process.cwd(), "logs");

if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey',
  },
};

const logger = winston.createLogger({
  levels: logLevels.levels,
  defaultMeta: { service: 'my-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, requestId, method, url, statusCode, durationMs, ...meta }) => {
          const parts = [`${timestamp} [${level}]`];

          if (requestId) {
            parts.push(`[requestId=${requestId}]`);
          }

          if (method && url) {
            parts.push(`${method} ${url}`);
          }

          if (typeof statusCode !== "undefined") {
            parts.push(`status=${statusCode}`);
          }

          if (typeof durationMs !== "undefined") {
            parts.push(`durationMs=${durationMs}`);
          }

          parts.push(String(message));

          const extraMeta = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";

          return `${parts.join(" ")}${extraMeta}`;
        })
      ),
      level: 'debug',
    }),
    new winston.transports.File({
      filename: 'logs/server.log',
      level: 'http',
      format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

winston.addColors(logLevels.colors);

export default logger;