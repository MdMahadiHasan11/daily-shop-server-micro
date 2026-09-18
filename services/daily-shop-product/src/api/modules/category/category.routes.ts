import { BaseRoutes } from "../../../core/base/base.routes";
import { CategoryController } from "./category.controller";
import { CategoryValidators } from "./category.validator";

export class CategoryRoutes extends BaseRoutes<CategoryController> {
  constructor() {
    super(new CategoryController());
  }

  protected registerRoutes(): void {
    // Get all categories (with flat or tree view support)
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CategoryValidators.listCategories),
      this.controller.getAllCategories,
    );

    // Restore soft-deleted category
    this.router.patch(
      "/restore/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CategoryValidators.getById),
      this.controller.restoreCategory,
    );

    // Hard delete category permanently 
    this.router.delete(
      "/hard-delete/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CategoryValidators.getById),
      this.controller.hardDeleteCategory,
    );

    // Get single category by ID
    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CategoryValidators.getById),
      this.controller.getCategoryById,
    );

    // Create a new category
    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CategoryValidators.createCategory),
      this.controller.createCategory,
    );

    // Update category by ID
    this.router.patch(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CategoryValidators.updateCategory),
      this.controller.updateCategory,
    );

    // Soft delete category by ID
    this.router.delete(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CategoryValidators.getById),
      this.controller.deleteCategory,
    );
  }
}