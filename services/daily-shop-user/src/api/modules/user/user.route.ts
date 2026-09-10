import { BaseRoutes } from "../../../core/base/base.routes";
import { UserController } from "./user.controller";
import { UserValidators } from "./user.validator";

export class UserRoutes extends BaseRoutes<UserController> {
  constructor() {
    super(new UserController());
  }

  protected registerRoutes(): void {
    // this.router.post(
    //   "/",
    //   this.validateService.auth,
    //   this.controller.createUser,
    // );

    // admin
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(UserValidators.listUsers),
      this.controller.getAllUser,
    );

    this.router.get(
      "/me",
      this.validateService.allow(["gateway"]),
      this.validateRequest(UserValidators.getMeSchema),
      this.controller.getMe,
    );

    this.router.patch(
      "/profile",
      this.validateService.allow(["gateway"]),
      this.validateRequest(UserValidators.updateFullProfile),
      this.controller.updateProfile,
    );
  }
}
