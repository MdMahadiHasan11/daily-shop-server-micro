import { BaseRoutes } from "../../../core/base/base.routes";
import { UserController } from "./user.controller";
import { UserValidators } from "./user.validator";

export class UserRoutes extends BaseRoutes<UserController> {
  constructor() {
    super(new UserController());
  }

  protected registerRoutes(): void {
    this.router.post("/", this.controller.createUser);
    this.router.get(
      "/",
      this.validateRequest(UserValidators.listUsers),
      this.controller.getAllUser,
    );
  }
}
