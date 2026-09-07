import { NextFunction, Request, Response } from "express";
import { metrics } from "../../core/services/metrics.service";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export function trackMetrics(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const route = req.route ? req.route.path : req.path;

  metrics.activeRequests.inc();

  const userType = req.user ? "authenticated" : "guest";
  metrics.userConnected(userType);

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode.toString();

    metrics.httpRequests.inc({
      method: req.method,
      route: route,
      status: statusCode,
    });

    metrics.httpRequestDuration.observe(
      { method: req.method, route: route },
      duration,
    );

    metrics.activeRequests.dec();
    metrics.userDisconnected(userType);
  });

  next();
}
