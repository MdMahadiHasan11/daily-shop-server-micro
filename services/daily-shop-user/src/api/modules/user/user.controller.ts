import { Request, Response } from "express";

import { BaseController } from "../../../core/base/base.controller";
import { UserService } from "./user.service";

export class UserController extends BaseController {
  private service: UserService;

  constructor() {
    super();
    this.service = new UserService();
  }

  createUser = this.asyncHandler(async (req: Request, res: Response) => {
    return this.successResponse(res, { user: null }, 200);
  });
  getAllUser = this.asyncHandler(async (req: Request, res: Response) => {
    return this.successResponse(res, { user: "Get all user" }, 200);
  });
}
