import { Request, Response, Router } from "express";
import { metrics } from "../../core/services/metrics.service";
import { logger } from "../../core/utils/logger.utils";

const metricsRouter = Router();

metricsRouter.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await metrics.getMetrics();
    res.setHeader("Content-Type", metrics.registry.contentType);
    res.status(200).send(data);
  } catch (err) {
    logger.error(err, "💥 Error generating prometheus metrics");
    res.status(500).json({
      success: false,
      message: "Error generating metrics",
    });
  }
});

export default metricsRouter;
