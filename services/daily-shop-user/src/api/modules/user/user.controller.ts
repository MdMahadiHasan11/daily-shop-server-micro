import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { AppError } from "../../../core/errors/errors";
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

  getMe = this.asyncHandler(async (req: Request, res: Response) => {
    const metaData = this.getReqMetadata(req) as IMetaData;

    if (!metaData.authId) {
      throw new AppError(
        "Cannot fetch user profile. Auth ID is missing in request headers.",
        400,
        true,
        undefined,
        "MISSING_AUTH_ID",
      );
    }
    const query = req.validatedBody?.query;
    const includeQuery = query?.include;
    const includeLocation =
      includeQuery === "location" || includeQuery === "locations";
    const result = await this.service.getUserDetails(
      metaData.authId,
      includeLocation,
    );

    return this.successResponse(res, result, 200);
  });

  updateProfile = this.asyncHandler(async (req: Request, res: Response) => {
    const metaData = this.getReqMetadata(req) as IMetaData;
    const updateData = req.body;

    if (!metaData.authId) {
      throw new AppError(
        "Cannot fetch user profile. Auth ID is missing in request headers.",
        400,
        true,
        undefined,
        "MISSING_AUTH_ID",
      );
    }
    const result = await this.service.updateFullProfile(
      metaData.authId,
      updateData,
    );
    return this.successResponse(res, result, 200, {
      message: "Profile update successfully",
    });
  });
}
