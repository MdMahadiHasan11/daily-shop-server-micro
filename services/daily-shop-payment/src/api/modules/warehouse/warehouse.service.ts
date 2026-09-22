import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { WarehouseRepository } from "./warehouse.repository";

export class WarehouseService extends BaseService {
  private readonly repository: WarehouseRepository;

  constructor() {
    super();
    this.repository = new WarehouseRepository();
    this.serviceName = "WarehouseService";
  }

  async getAllWarehouses(query: any) {
    try {
      return await this.repository.getList(query);
    } catch (error) {
      this._handleError(error, "getAllWarehouses", { query });
      throw error;
    }
  }

  async getWarehouseById(id: string) {
    try {
      const warehouse = await this.repository.findById(id);
      if (!warehouse) {
        throw new AppError("Warehouse not found", 404, true, undefined, "WAREHOUSE_NOT_FOUND");
      }
      return warehouse;
    } catch (error) {
      this._handleError(error, "getWarehouseById", { id });
      throw error;
    }
  }

  async createWarehouse(data: any) {
    try {
      return await this.repository.create(data);
    } catch (error) {
      this._handleError(error, "createWarehouse", { data });
      throw error;
    }
  }

  async updateWarehouse(id: string, data: any) {
    try {
      const warehouse = await this.repository.findByIdIncludingDeleted(id);
      if (!warehouse) {
        throw new AppError("Warehouse not found", 404, true, undefined, "WAREHOUSE_NOT_FOUND");
      }

      const { name, code, address, isMain, isDeleted } = data;
      const updatePayload: any = {};

      if (name !== undefined) updatePayload.name = name;
      if (code !== undefined) updatePayload.code = code;
      if (address !== undefined) updatePayload.address = address;
      if (isMain !== undefined) updatePayload.isMain = isMain;
      if (isDeleted !== undefined) updatePayload.isDeleted = isDeleted;

      return await this.repository.update(id, updatePayload);
    } catch (error) {
      this._handleError(error, "updateWarehouse", { id, data });
      throw error;
    }
  }

  async softDeleteWarehouse(id: string) {
    try {
      const warehouse = await this.repository.findByIdIncludingDeleted(id);
      if (!warehouse) {
        throw new AppError("Warehouse not found", 404, true, undefined, "WAREHOUSE_NOT_FOUND");
      }
      if (warehouse.isDeleted) {
        throw new AppError("Warehouse is already deleted", 400, true, undefined, "WAREHOUSE_ALREADY_DELETED");
      }
      return await this.repository.update(id, { isDeleted: true });
    } catch (error) {
      this._handleError(error, "softDeleteWarehouse", { id });
      throw error;
    }
  }

  async restoreWarehouse(id: string) {
    try {
      const warehouse = await this.repository.findByIdIncludingDeleted(id);
      if (!warehouse) {
        throw new AppError("Warehouse not found", 404, true, undefined, "WAREHOUSE_NOT_FOUND");
      }
      if (!warehouse.isDeleted) {
        throw new AppError("Warehouse is not deleted yet", 400, true, undefined, "WAREHOUSE_NOT_DELETED");
      }
      return await this.repository.update(id, { isDeleted: false });
    } catch (error) {
      this._handleError(error, "restoreWarehouse", { id });
      throw error;
    }
  }

  async hardDeleteWarehouse(id: string) {
    try {
      const warehouse = await this.repository.findByIdIncludingDeleted(id);
      if (!warehouse) {
        throw new AppError("Warehouse not found", 404, true, undefined, "WAREHOUSE_NOT_FOUND");
      }
      if (!warehouse.isDeleted) {
        throw new AppError("Warehouse must be soft deleted before permanent deletion", 400, true, undefined, "WAREHOUSE_NOT_SOFT_DELETED");
      }
      return await this.repository.hardDelete(id);
    } catch (error) {
      this._handleError(error, "hardDeleteWarehouse", { id });
      throw error;
    }
  }

  async handleBulkOperation(payload: { ids: string[]; action: "soft-delete" | "restore" | "hard-delete" }) {
    try {
      const { ids, action } = payload;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError("Invalid or empty IDs array provided", 400, true, undefined, "INVALID_IDS");
      }

      if (action === "soft-delete") {
        return await this.repository.updateManyStatus(ids, true);
      } else if (action === "restore") {
        return await this.repository.updateManyStatus(ids, false);
      } else if (action === "hard-delete") {
        return await this.repository.hardDeleteMany(ids);
      } else {
        throw new AppError("Invalid bulk action specified", 400, true, undefined, "INVALID_ACTION");
      }
    } catch (error) {
      this._handleError(error, "handleBulkOperation", { payload });
      throw error;
    }
  }
}