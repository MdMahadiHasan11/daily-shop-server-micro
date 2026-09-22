import cron from "node-cron";
import { logger } from "../utils/logger.utils";

export class ExpiredBatchCronService {
  private cronExpression: string;
  // private stockExpiredService: StockExpiredService;

  constructor(cronExpression: string = "1 0 * * *") {
    this.cronExpression = cronExpression;
    // this.stockExpiredService = new StockExpiredService();
  }

  public start(): void {
    cron.schedule(this.cronExpression, async () => {
      logger.info("⏰ [Cron Job] Triggered: Expired batch checking...");

      try {
        // await this.stockExpiredService.processAndArchiveExpiredBatches();
      } catch (error: any) {
        logger.error(
          { err: error?.message },
          "❌ [Cron Job] Error occurred while processing expired batches.",
        );
      }
    });

    logger.info(
      `✅ ExpiredBatchCronService successfully registered with schedule: ${this.cronExpression}`,
    );
  }
}

export const expiredBatchCron = new ExpiredBatchCronService();
