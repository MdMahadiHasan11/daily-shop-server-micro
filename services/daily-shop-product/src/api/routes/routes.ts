import { Router } from "express";
import { BrandRoutes } from "../modules/brand/brand.routes";
import { CategoryRoutes } from "../modules/category/category.routes";
import { ProductRoutes } from "../modules/product/product.route";
import { TagRoutes } from "../modules/tag/tag.routes";
import { ProductVariantRoutes } from "../modules/variant/variant.route";

const router = Router();
// router.use(authenticate);
router.use("/product", new ProductRoutes().getRouter());
router.use("/variant", new ProductVariantRoutes().getRouter());
router.use("/categories", new CategoryRoutes().getRouter());
router.use("/brand", new BrandRoutes().getRouter());
router.use("/tag", new TagRoutes().getRouter());

export default router;
