import { Router } from "express";

import { validate } from "../../api/middlewares/validation.middleware";
import { BaseController } from "./base.controller";

export abstract class BaseRoutes<T extends BaseController> {
  protected router: Router;
  protected controller: T;
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
