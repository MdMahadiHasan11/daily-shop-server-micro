import { BaseRoutes } from "../../../core/base/base.routes";
import { UserController } from "./user.controller";
import { UserValidators } from "./user.validator";

export class UserRoutes extends BaseRoutes<UserController> {
  constructor() {
    super(new UserController());
  }

  protected registerRoutes(): void {
    this.router.get(
      "/:id",
      this.validateRequest(UserValidators.getUserById),
      this.controller.getUserById,
    );
    this.router.patch(
      "/",
      this.validateRequest(UserValidators.updateUser),
      this.controller.updateUser,
    );
    this.router.get(
      "/",
      // authorize(this.moduleKey.users, [this.action.READ]),
      this.validateRequest(UserValidators.listUsers),
      this.controller.getAllUsers,
    );

    this.router.delete(
      "/:id",
      this.validateRequest(UserValidators.getUserById),
      this.controller.softDeleteUser,
    );

    this.router.delete(
      "/hard/:id",
      this.validateRequest(UserValidators.getUserById),
      this.controller.hardDelete,
    );
  }
}
