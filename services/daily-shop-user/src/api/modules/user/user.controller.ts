import { Request, Response } from "express";

import { BaseController } from "../../../core/base/base.controller";
import { UserService } from "./user.service";
import { UpdateUserBody, UserListQuery } from "./user.validator";

export class UserController extends BaseController {
  private service: UserService;

  constructor() {
    super();
    this.service = new UserService();
  }

  getAllUsers = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody.query as UserListQuery["query"];

    const result = await this.service.getAllUsers(query);

    this.successResponse(res, result.data, 200, {
      pagination: result.pagination,
    });
  });
  getUserById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody.params.id as string;
    // const metaData = this.getReqMetadata(req);

    const results = await this.service.getUserById(id);
    this.successResponse(res, results, 200, {
      message: "User found successfully",
    });
  });

  //
  updateUser = this.asyncHandler(async (req: Request, res: Response) => {
    const metaData = this.getReqMetadata(req);
    const body = req.validatedBody.body as UpdateUserBody["body"];

    const results = (await this.service.updateUser(
      metaData.userId,
      body,
    )) as any;

    // await refreshUserSession(req, results);

    this.successResponse(res, results, 200, {
      message: "User updated successfully",
    });
  });

  //
  softDeleteUser = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody.params.id as string;

    const results = await this.service.softDeleteUser(id);

    this.successResponse(res, results, 200, {
      message: "User deleted successfully",
    });
  });
  hardDelete = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody.params.id as string;
    const results = await this.service.hardDelete(id);
    this.successResponse(res, results, 200, {
      message: "User deleted successfully",
    });
  });
}
