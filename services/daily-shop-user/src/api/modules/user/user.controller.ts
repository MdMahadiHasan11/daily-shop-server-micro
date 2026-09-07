import { Request, Response } from "express";

import { BaseController } from "../../../core/base/base.controller";
import { IMetaData } from "../../../core/utils/request-metadata";
import { UserService } from "./user.service";
import { UserListQuery } from "./user.validator";

export class UserController extends BaseController {
  private service: UserService;

  constructor() {
    super();
    this.service = new UserService();
  }

  createUser = this.asyncHandler(async (req: Request, res: Response) => {
    const metaData = this.getReqMetadata(req) as IMetaData;
    const result = await this.service.createUsers(metaData);

    return this.successResponse(
      res,
      { user: result, message: "User create done" },
      200,
    );
  });
  getAllUser = this.asyncHandler(async (req: Request, res: Response) => {
    const metaData = this.getReqMetadata(req) as IMetaData;
    const query = req.validatedBody.query as UserListQuery["query"];
    const result = await this.service.getAllUsers(query);
    return this.successResponse(res, { user: result, metaData }, 200);
  });
}
