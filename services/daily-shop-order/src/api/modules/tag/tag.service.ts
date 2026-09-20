import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { TagRepository } from "./tag.repository";

export class TagService extends BaseService {
  private readonly repository: TagRepository;

  constructor() {
    super();
    this.repository = new TagRepository();
    this.serviceName = "TagService";
  }

  async getAllTags(query: any) {
    try {
      return await this.repository.getList(query);
    } catch (error) {
      this._handleError(error, "getAllTags", { query });
      throw error;
    }
  }

  async getTagById(id: string) {
    try {
      const tag = await this.repository.findById(id);
      if (!tag) {
        throw new AppError("Tag not found", 404, true, undefined, "TAG_NOT_FOUND");
      }
      return tag;
    } catch (error) {
      this._handleError(error, "getTagById", { id });
      throw error;
    }
  }

  async createTag(data: any) {
    try {
      return await this.repository.create(data);
    } catch (error) {
      this._handleError(error, "createTag", { data });
      throw error;
    }
  }

  async updateTag(id: string, data: any) {
    try {
      const tag = await this.repository.findByIdIncludingDeleted(id);
      if (!tag) {
        throw new AppError("Tag not found", 404, true, undefined, "TAG_NOT_FOUND");
      }

      const { name, slug, isDeleted } = data;
      const updatePayload: any = {};

      if (name !== undefined) updatePayload.name = name;
      if (slug !== undefined) updatePayload.slug = slug;
      if (isDeleted !== undefined) updatePayload.isDeleted = isDeleted;

      return await this.repository.update(id, updatePayload);
    } catch (error) {
      this._handleError(error, "updateTag", { id, data });
      throw error;
    }
  }

  async softDeleteTag(id: string) {
    try {
      const tag = await this.repository.findByIdIncludingDeleted(id);
      if (!tag) {
        throw new AppError("Tag not found", 404, true, undefined, "TAG_NOT_FOUND");
      }
      if (tag.isDeleted) {
        throw new AppError("Tag is already deleted", 400, true, undefined, "TAG_ALREADY_DELETED");
      }
      return await this.repository.update(id, { isDeleted: true });
    } catch (error) {
      this._handleError(error, "softDeleteTag", { id });
      throw error;
    }
  }

  async restoreTag(id: string) {
    try {
      const tag = await this.repository.findByIdIncludingDeleted(id);
      if (!tag) {
        throw new AppError("Tag not found", 404, true, undefined, "TAG_NOT_FOUND");
      }
      if (!tag.isDeleted) {
        throw new AppError("Tag is not deleted yet", 400, true, undefined, "TAG_NOT_DELETED");
      }
      return await this.repository.update(id, { isDeleted: false });
    } catch (error) {
      this._handleError(error, "restoreTag", { id });
      throw error;
    }
  }

  async hardDeleteTag(id: string) {
    try {
      const tag = await this.repository.findByIdIncludingDeleted(id);
      if (!tag) {
        throw new AppError("Tag not found", 404, true, undefined, "TAG_NOT_FOUND");
      }
      if (!tag.isDeleted) {
        throw new AppError("Tag must be soft deleted before permanent deletion", 400, true, undefined, "TAG_NOT_SOFT_DELETED");
      }
      return await this.repository.hardDelete(id);
    } catch (error) {
      this._handleError(error, "hardDeleteTag", { id });
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