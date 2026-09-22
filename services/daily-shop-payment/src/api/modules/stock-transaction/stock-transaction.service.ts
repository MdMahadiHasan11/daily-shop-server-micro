import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { StockTransactionRepository } from "./stock-transaction.repository";

export class StockTransactionService extends BaseService {
  private readonly repository: StockTransactionRepository;

  constructor() {
    super();
    this.repository = new StockTransactionRepository();
    this.serviceName = "StockTransactionService";
  }

  // Get all transactions with pagination and filtering
  async getAllTransactions(query: any) {
    try {
      return await this.repository.getList(query, {
        include: {
          warehouse: true,
          productVariant: true,
        },
      });
    } catch (error) {
      this._handleError(error, "getAllTransactions", { query });
      throw error;
    }
  }

  // Get single transaction by ID
  async getTransactionById(id: string) {
    try {
      const transaction = await this.repository.findByIdWithRelations(id);
      if (!transaction) {
        throw new AppError("Stock transaction record not found", 404, true, undefined, "TRANSACTION_NOT_FOUND");
      }
      return transaction;
    } catch (error) {
      this._handleError(error, "getTransactionById", { id });
      throw error;
    }
  }

  // Create an audit log transaction entry (Internal service use)
  async createTransaction(data: any) {
    try {
      return await this.repository.create(data, {
        include: {
          warehouse: true,
          productVariant: true,
        },
      });
    } catch (error) {
      this._handleError(error, "createTransaction", { data });
      throw error;
    }
  }
}