import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { SupplierRepository } from "./supplier.repository";

export class SupplierService extends BaseService {
  private readonly repository: SupplierRepository;

  constructor() {
    super();
    this.repository = new SupplierRepository();
    this.serviceName = "SupplierService";
  }

  async getAllSuppliers(query: any) {
    try {
      return await this.repository.getList(query);
    } catch (error) {
      this._handleError(error, "getAllSuppliers", { query });
      throw error;
    }
  }

  async getSupplierById(id: string) {
    try {
      const supplier = await this.repository.findById(id);
      if (!supplier) {
        throw new AppError("Supplier not found", 404, true, undefined, "SUPPLIER_NOT_FOUND");
      }
      return supplier;
    } catch (error) {
      this._handleError(error, "getSupplierById", { id });
      throw error;
    }
  }

  async createSupplier(data: any) {
    try {
      return await this.repository.create(data);
    } catch (error) {
      this._handleError(error, "createSupplier", { data });
      throw error;
    }
  }

  async updateSupplier(id: string, data: any) {
    try {
      const supplier = await this.repository.findByIdIncludingDeleted(id);
      if (!supplier) {
        throw new AppError("Supplier not found", 404, true, undefined, "SUPPLIER_NOT_FOUND");
      }

      const { name, contactPerson, email, phone, address, isDeleted } = data;
      const updatePayload: any = {};

      if (name !== undefined) updatePayload.name = name;
      if (contactPerson !== undefined) updatePayload.contactPerson = contactPerson;
      if (email !== undefined) updatePayload.email = email;
      if (phone !== undefined) updatePayload.phone = phone;
      if (address !== undefined) updatePayload.address = address;
      if (isDeleted !== undefined) updatePayload.isDeleted = isDeleted;

      return await this.repository.update(id, updatePayload);
    } catch (error) {
      this._handleError(error, "updateSupplier", { id, data });
      throw error;
    }
  }

  async softDeleteSupplier(id: string) {
    try {
      const supplier = await this.repository.findByIdIncludingDeleted(id);
      if (!supplier) {
        throw new AppError("Supplier not found", 404, true, undefined, "SUPPLIER_NOT_FOUND");
      }
      if (supplier.isDeleted) {
        throw new AppError("Supplier is already deleted", 400, true, undefined, "SUPPLIER_ALREADY_DELETED");
      }
      return await this.repository.update(id, { isDeleted: true });
    } catch (error) {
      this._handleError(error, "softDeleteSupplier", { id });
      throw error;
    }
  }

  async restoreSupplier(id: string) {
    try {
      const supplier = await this.repository.findByIdIncludingDeleted(id);
      if (!supplier) {
        throw new AppError("Supplier not found", 404, true, undefined, "SUPPLIER_NOT_FOUND");
      }
      if (!supplier.isDeleted) {
        throw new AppError("Supplier is not deleted yet", 400, true, undefined, "SUPPLIER_NOT_DELETED");
      }
      return await this.repository.update(id, { isDeleted: false });
    } catch (error) {
      this._handleError(error, "restoreSupplier", { id });
      throw error;
    }
  }

  async hardDeleteSupplier(id: string) {
    try {
      const supplier = await this.repository.findByIdIncludingDeleted(id);
      if (!supplier) {
        throw new AppError("Supplier not found", 404, true, undefined, "SUPPLIER_NOT_FOUND");
      }
      if (!supplier.isDeleted) {
        throw new AppError("Supplier must be soft deleted before permanent deletion", 400, true, undefined, "SUPPLIER_NOT_SOFT_DELETED");
      }
      return await this.repository.hardDelete(id);
    } catch (error) {
      this._handleError(error, "hardDeleteSupplier", { id });
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