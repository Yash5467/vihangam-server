
import express from "express"
import helmet from "helmet"
import cors from 'cors'
import { errorMiddleware } from "@/middlewares/error.js"
import morgan from "morgan"
import { connectDB } from "@/lib/db.js"
// import { rateLimiter } from "@/middlewares/rate-limiter.js";
import dotenv from "dotenv"
import { studentRouter } from "./routes/student.routes.js"
import { eventRouter } from "./routes/event.routes.js"
import { registrationRouter } from "./routes/registration.routes.js"
import { badgeRouter } from "./routes/badge.routes.js"
import "@/workers/index.js"
import { transactionRouter } from "./routes/transaction.route.js"

dotenv.config({ path: './.env', });

export const envMode = process.env.NODE_ENV?.trim() || 'DEVELOPMENT';
const port = process.env.PORT || 3000;
const app = express();




app.use(
  helmet({
    contentSecurityPolicy: envMode !== "DEVELOPMENT",
    crossOriginEmbedderPolicy: envMode !== "DEVELOPMENT",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.ORIGIN!, credentials: true }));
app.use(morgan('dev'));
// app.use(rateLimiter());


app.use("/student",studentRouter);
app.use("/event", eventRouter);
app.use("/registration", registrationRouter);
app.use("/badge", badgeRouter);
app.use("/transaction", transactionRouter);


app.get("/*splat", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Page not found",
  });
});

app.use(errorMiddleware);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => console.log('Server is working on Port:' + port + ' in ' + envMode + ' Mode.'));
  } catch (error) {
    console.error('Failed to connect database. Server not started.', error);
    process.exit(1);
  }
};

startServer();
