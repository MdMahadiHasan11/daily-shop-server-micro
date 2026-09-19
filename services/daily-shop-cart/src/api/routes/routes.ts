import { Router } from "express";
import { CartRoutes } from "../modules/cart/cart.routes";

const router = Router();
router.use("/", new CartRoutes().getRouter());

export default router;
