
import mongoose from "mongoose";
import logger from "@/utils/logger.js";

export const connectDB = () => {
  const mongoURL = process.env.MONGO_URL!;
  mongoose
    .connect(mongoURL)
    .then((c) => {
      logger.info("Database connected", {
        databaseName: c.connection.name,
        host: c.connection.host,
      });
    })
    .catch((error) => {
      logger.error("Database connection failed", { error });
    });
}

