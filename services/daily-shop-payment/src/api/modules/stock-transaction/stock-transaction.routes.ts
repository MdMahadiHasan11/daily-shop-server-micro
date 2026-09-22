import { BaseRoutes } from "../../../core/base/base.routes";
import { StockTransactionController } from "./stock-transaction.controller";
import { StockTransactionValidators } from "./stock-transaction.validator";

export class StockTransactionRoutes extends BaseRoutes<StockTransactionController> {
  constructor() {
    super(new StockTransactionController());
  }

  protected registerRoutes(): void {
    // Get all transactions with pagination and filtering
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockTransactionValidators.listTransactions),
      this.controller.getAllTransactions,
    );

    // Get single transaction by ID
    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.getTransactionById,
    );

    // Create a transaction ledger log entry
    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockTransactionValidators.createTransaction),
      this.controller.createTransaction,
    );
  }
}