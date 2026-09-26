import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { ProductService } from "./product.service";
import { ProductListQuery } from "./product.validator";

export class ProductController extends BaseController {
  private service: ProductService;

  constructor() {
    super();
    this.service = new ProductService();
  }

  getAllProducts = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody.query as ProductListQuery["query"];
    const result = await this.service.getAllProducts(query);
    return this.successResponse(res, result.data, 200, {
      pagination: result.pagination,
      query,
    });
  });

  getProductById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.getProductDetails(id as string);
    return this.successResponse(res, result, 200);
  });

  createProduct = this.asyncHandler(async (req: Request, res: Response) => {
    const productData = req.validatedBody.body;
    const result = await this.service.createProduct(productData);
    return this.successResponse(res, result, 201, {
      message: "Product created successfully with variants",
    });
  });

  getProductsByBulk = this.asyncHandler(async (req: Request, res: Response) => {
    const { productIds } = req.validatedBody.body;
    const result = await this.service.getProductsByBulk(productIds);
    return this.successResponse(res, result, 200);
  });

  getVariantsByBulk = this.asyncHandler(async (req: Request, res: Response) => {
    const { variantIds } = req.validatedBody.body;
    const result = await this.service.getVariantsByBulk(variantIds);
    return this.successResponse(res, result, 200);
  });
}
