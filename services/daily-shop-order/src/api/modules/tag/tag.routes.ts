import { BaseRoutes } from "../../../core/base/base.routes";
import { TagController } from "./tag.controller";
import { TagValidators } from "./tag.validator";

export class TagRoutes extends BaseRoutes<TagController> {
  constructor() {
    super(new TagController());
  }

  protected registerRoutes(): void {
    // Bulk operation route
    this.router.post(
      "/bulk",
      this.validateService.allow(["gateway"]),
      this.validateRequest(TagValidators.bulkOperation),
      this.controller.bulkOperation,
    );

    // Get all tags
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(TagValidators.listTags),
      this.controller.getAllTags,
    );

    // Get single tag by ID
    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.getTagById,
    );

    // Create tag
    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(TagValidators.createTag),
      this.controller.createTag,
    );

    // Update tag
    this.router.patch(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(TagValidators.updateTag),
      this.controller.updateTag,
    );

    // Restore tag
    this.router.patch(
      "/restore/:id",
      this.validateService.allow(["gateway"]),
      this.controller.restoreTag,
    );

    // Soft delete tag
    this.router.delete(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.softDeleteTag,
    );

    // Hard delete tag
    this.router.delete(
      "/hard-delete/:id",
      this.validateService.allow(["gateway"]),
      this.controller.hardDeleteTag,
    );
  }
}