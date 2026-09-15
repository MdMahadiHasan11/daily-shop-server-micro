// import { PermissionAction, UserTypeEnum } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../api/middlewares/authentication.middleware";
import { validateServiceMiddleware } from "../../api/middlewares/validate.service";
import { validate } from "../../api/middlewares/validation.middleware";
import { BaseController } from "./base.controller";
// import { authorize } from "../../api/middlewares/authorization.middleware";
// import { validate } from "../../api/middlewares/validation.middleware";
// import { ModuleKey } from "../../common/constants/moduleKey.constant";

export abstract class BaseRoutes<T extends BaseController> {
  protected router: Router;
  protected controller: T;
  protected authenticate = authenticate;
  protected validateService = validateServiceMiddleware;
  // protected authorize = authorize;
  // protected moduleKey = ModuleKey;
  // protected action = PermissionAction;
  // protected userType = UserTypeEnum;
  protected validateRequest = validate;
  protected abstract registerRoutes(): void;

  constructor(controller: T) {
    this.router = Router();
    this.controller = controller;
    this.registerRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }
  public applyRoutes(appRouter: Router): void {
    appRouter.use(this.router);
  }
}
