import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import { globalErrorHandler } from "./api/middlewares/globalErrorHandler";
import { httpLogger } from "./api/middlewares/http-logger.middleware";
import { trackMetrics } from "./api/middlewares/metrics.middleware";
import { notFoundHandler } from "./api/middlewares/notFound.middleware";
import { securityMiddleware } from "./api/middlewares/security.middleware";
import metricsRouter from "./api/routes/metrics.routes";
import router from "./api/routes/routes";
import db from "./core/lib/prisma";
import { redisService } from "./core/services/redis.service";
import jwtHelper from "./core/utils/jwt.helper";
import { responseUtil } from "./core/utils/response.util";

const app = express();
app.use(trackMetrics);

app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));
app.use(securityMiddleware);
app.use(httpLogger);

app.use("/metrics", metricsRouter);
app.use("/uploads", express.static("uploads"));

// Base Route
app.get("/", (_req, res) => {
  return responseUtil.success(res, { status: "ok" });
});

app.get("/health", async (_req, res) => {
  const isHealthy = await db.healthCheck();

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "OK" : "unhealthy",
    message: isHealthy ? "Server is healthy" : "Server is unhealthy",
    database: isHealthy ? "connected" : "disconnected",
  });
});

app.use("/v1/user", router);

app.get("/session", async (req, res) => {
  try {
    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers.authorization;

    const token =
      cookieToken ||
      (authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : undefined);
    const decoded = jwtHelper.verifyAccessToken(token);

    const session = await redisService.get(`session:${decoded.jti}`);
    if (!session) {
      return res.status(401).json({ message: "Session expired or invalid" });
    }
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: "Session Expired!!!" });
  }
});

// Global Error Handler

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
