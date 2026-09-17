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

  getAllUser = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody.query as UserListQuery["query"];
    const result = await this.service.getAllUsers(query);
    return this.successResponse(res, result.data, 200, {
      pagination: result.pagination,
      query,
    });
  });

  getMe = this.asyncHandler(async (req: Request, res: Response) => {
    const metaData = this.getReqMetadata(req) as IMetaData;

    if (!metaData.id) {
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
      metaData.id,
      includeLocation,
    );

    return this.successResponse(res, result, 200);
  });

  updateProfile = this.asyncHandler(async (req: Request, res: Response) => {
    console.log("ssssssssssssssssssssssssssssssssssssssssssss");
    const metaData = this.getReqMetadata(req) as IMetaData;
    const updateData = req.validatedBody?.body;

    console.log(updateData, "ssssssssssssssssssssssssssssssssssssssssssss");

    if (!metaData.id) {
      throw new AppError(
        "Cannot fetch user profile. Auth ID is missing in request headers.",
        400,
        true,
        undefined,
        "MISSING_AUTH_ID",
      );
    }
    const result = await this.service.updateFullProfile(
      metaData.id,
      updateData,
    );
    return this.successResponse(res, result, 200, {
      message: "Profile update successfully",
    });
  });
}
