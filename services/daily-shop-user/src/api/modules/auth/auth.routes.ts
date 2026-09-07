import { BaseRoutes } from "../../../core/base/base.routes";
import { authenticate } from "../../middlewares/authentication.middleware";
import { AuthController } from "./auth.controller";
import { AuthValidators } from "./auth.validator";

export class AuthRoutes extends BaseRoutes<AuthController> {
  constructor() {
    super(new AuthController());
  }

  protected registerRoutes(): void {
    // initiate login
    this.router.post(
      "/login-register-initiate",
      this.validateRequest(AuthValidators.login),
      this.controller.loginInitiate,
    );

    // verify login
    this.router.post(
      "/login-register-verify",
      this.validateRequest(AuthValidators.verify),
      this.controller.loginVerify,
    );

    // forgot password
    // this.router.post(
    //   "/forgot-password",
    //   this.validateRequest(AuthValidators.resetCredential),
    //   this.controller.generateResetCredentials,
    // );
    this.router.post("/logout", this.controller.logout);
    this.router.use(authenticate);
    this.router.get("/me", this.controller.getMe);
  }
}
