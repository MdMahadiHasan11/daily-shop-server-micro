import { Router } from "express";
import { ProductRoutes } from "../modules/product/product.route";
import { CategoryRoutes } from "../modules/category/category.routes";
import { BrandRoutes } from "../modules/brand/brand.routes";
import { TagRoutes } from "../modules/tag/tag.routes";

const router = Router();
// router.use(authenticate);
router.use("/product", new ProductRoutes().getRouter());
router.use("/categories", new CategoryRoutes().getRouter());
router.use("/brand", new BrandRoutes().getRouter());
router.use("/tag", new TagRoutes().getRouter());


export default router;
