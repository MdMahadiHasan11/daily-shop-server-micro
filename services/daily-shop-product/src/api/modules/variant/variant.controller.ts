import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { ProductVariantService } from "./variant.service";
import {
  GetParamsId,
  ProductVariantCreate,
  ProductVariantListQuery,
} from "./variant.validator";

export class ProductVariantController extends BaseController {
  private service: ProductVariantService;

  constructor() {
    super();
    this.service = new ProductVariantService();
  }

  getAllProductVariant = this.asyncHandler(
    async (req: Request, res: Response) => {
      const query = req.validatedBody.query as ProductVariantListQuery["query"];
      const result = await this.service.getAllProductVariant(query);
      return this.successResponse(res, result.data, 200, {
        pagination: result.pagination,
        query,
      });
    },
  );

  getProductVariantById = this.asyncHandler(
    async (req: Request, res: Response) => {
      const id = req.validatedBody.params.id as GetParamsId["params"]["id"];
      const result = await this.service.getProductVariantDetails(id as string);
      return this.successResponse(res, result, 200);
    },
  );

  createProductVariant = this.asyncHandler(
    async (req: Request, res: Response) => {
      const productVariantData = req.validatedBody
        .body as ProductVariantCreate["body"];

      const result =
        await this.service.createProductVariant(productVariantData);
      return this.successResponse(res, result, 201, {
        message: "Variant created successfully .",
      });
    },
  );

  getVariantsByBulk = this.asyncHandler(async (req: Request, res: Response) => {
    const { variantIds } = req.validatedBody.body;
    const result = await this.service.getVariantsByBulk(variantIds);
    return this.successResponse(res, result, 200);
  });
}
