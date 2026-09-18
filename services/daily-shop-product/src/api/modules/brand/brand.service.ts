import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { BrandRepository } from "./brand.repository";

export class BrandService extends BaseService {
  private readonly repository: BrandRepository;

  constructor() {
    super();
    this.repository = new BrandRepository();
    this.serviceName = "BrandService";
  }

  async getAllBrands(query: any) {
    try {
      return await this.repository.getList(query);
    } catch (error) {
      this._handleError(error, "getAllBrands", { query });
      throw error;
    }
  }

  async getBrandById(id: string) {
    try {
      const brand = await this.repository.findById(id);
      if (!brand) {
        throw new AppError(
          "Brand not found",
          404,
          true,
          undefined,
          "BRAND_NOT_FOUND",
        );
      }
      return brand;
    } catch (error) {
      this._handleError(error, "getBrandById", { id });
      throw error;
    }
  }

  async createBrand(data: any) {
    try {
      return await this.repository.create(data);
    } catch (error) {
      this._handleError(error, "createBrand", { data });
      throw error;
    }
  }

  async updateBrand(id: string, data: any) {
    try {
      const brand = await this.repository.findByIdIncludingDeleted(id);
      if (!brand) {
        throw new AppError(
          "Brand not found",
          404,
          true,
          undefined,
          "BRAND_NOT_FOUND",
        );
      }

      const { name, slug, description, logo, website, isDeleted } = data;
      const updatePayload: any = {};

      if (name !== undefined) updatePayload.name = name;
      if (slug !== undefined) updatePayload.slug = slug;
      if (description !== undefined) updatePayload.description = description;
      if (logo !== undefined) updatePayload.logo = logo;
      if (website !== undefined) updatePayload.website = website;
      if (isDeleted !== undefined) updatePayload.isDeleted = isDeleted;

      return await this.repository.update(id, updatePayload);
    } catch (error) {
      this._handleError(error, "updateBrand", { id, data });
      throw error;
    }
  }

  // soft delete
  async softDeleteBrand(id: string) {
    try {
      const brand = await this.repository.findByIdIncludingDeleted(id);
      if (!brand) {
        throw new AppError(
          "Brand not found",
          404,
          true,
          undefined,
          "BRAND_NOT_FOUND",
        );
      }
      if (brand.isDeleted) {
        throw new AppError(
          "Brand is already deleted",
          400,
          true,
          undefined,
          "BRAND_ALREADY_DELETED",
        );
      }

      return await this.repository.update(id, { isDeleted: true });
    } catch (error) {
      this._handleError(error, "softDeleteBrand", { id });
      throw error;
    }
  }

  // single reset
  async restoreBrand(id: string) {
    try {
      const brand = await this.repository.findByIdIncludingDeleted(id);
      if (!brand) {
        throw new AppError(
          "Brand not found",
          404,
          true,
          undefined,
          "BRAND_NOT_FOUND",
        );
      }
      if (!brand.isDeleted) {
        throw new AppError(
          "Brand is not deleted yet",
          400,
          true,
          undefined,
          "BRAND_NOT_DELETED",
        );
      }

      return await this.repository.update(id, { isDeleted: false });
    } catch (error) {
      this._handleError(error, "restoreBrand", { id });
      throw error;
    }
  }

  // hard
  async hardDeleteBrand(id: string) {
    try {
      const brand = await this.repository.findByIdIncludingDeleted(id);
      if (!brand) {
        throw new AppError(
          "Brand not found",
          404,
          true,
          undefined,
          "BRAND_NOT_FOUND",
        );
      }
      if (!brand.isDeleted) {
        throw new AppError(
          "Brand must be soft deleted before permanent deletion",
          400,
          true,
          undefined,
          "BRAND_NOT_SOFT_DELETED",
        );
      }

      return await this.repository.hardDelete(id);
    } catch (error) {
      this._handleError(error, "hardDeleteBrand", { id });
      throw error;
    }
  }

  // [delete-restore]
  async handleBulkOperation(payload: {
    ids: string[];
    action: "soft-delete" | "restore" | "hard-delete";
  }) {
    try {
      const { ids, action } = payload;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError(
          "Invalid or empty IDs array provided",
          400,
          true,
          undefined,
          "INVALID_IDS",
        );
      }

      if (action === "soft-delete") {
        return await this.repository.updateManyStatus(ids, true);
      } else if (action === "restore") {
        return await this.repository.updateManyStatus(ids, false);
      } else if (action === "hard-delete") {
        return await this.repository.hardDeleteMany(ids);
      } else {
        throw new AppError(
          "Invalid bulk action specified",
          400,
          true,
          undefined,
          "INVALID_ACTION",
        );
      }
    } catch (error) {
      this._handleError(error, "handleBulkOperation", { payload });
      throw error;
    }
  }
}