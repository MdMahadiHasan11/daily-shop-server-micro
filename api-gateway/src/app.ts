import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { globalErrorHandler } from "./api/middlewares/globalErrorHandler";
import { notFoundHandler } from "./api/middlewares/notFound.middleware";
import { globalLimiter } from "./api/middlewares/rate-limiter.middleware";
import gatewayRouter from "./api/routes";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan("combined"));
app.use(globalLimiter);

app.get("/gateway/health", (_req: Request, res: Response) => {
  res.status(250).json({
    success: true,
    message: "API Gateway is running smoothly 🚀",
    timestamp: new Date().toISOString(),
  });
});

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/", gatewayRouter);
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
