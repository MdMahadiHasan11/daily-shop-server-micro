import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { logger } from "../../../core/utils/logger.utils";
import { StockExpiredRepository } from "./stock-expired.repository";

export class StockExpiredService extends BaseService {
  private readonly repository: StockExpiredRepository;

  constructor() {
    super();
    this.repository = new StockExpiredRepository();
    this.serviceName = "StockExpiredService";
  }

  async processAndArchiveExpiredBatches() {
    try {
      const today = new Date();

      const expiredBatches =
        await this.repository.findPendingExpiredBatches(today);

      if (expiredBatches.length === 0) {
        logger.info(
          "ℹ️ [Stock Expired Service] No expired batches found today. All clean! 👍",
        );
        return 0;
      }

      await this.repository.archiveAndProcessBatches(expiredBatches);

      logger.info(
        `🚀 [Stock Expired Service] Successfully archived ${expiredBatches.length} expired batches.`,
      );

      return expiredBatches.length;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "processAndArchiveExpiredBatches", {});
      throw error;
    }
  }
}
