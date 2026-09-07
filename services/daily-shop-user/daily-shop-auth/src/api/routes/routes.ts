import { Router } from "express";
// import { authenticate } from "../middlewares/authentication.middleware";
import { authConfig } from "../../core/config/auth.config";
import { authenticate } from "../middlewares/authentication.middleware";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { CartRoutes } from "../modules/cart/cart.routes";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();
router.use("/auth", authConfig.authLimiter, new AuthRoutes().getRouter());
router.use("/cart", new CartRoutes().getRouter());
router.use(authenticate);
router.use("/user", new UserRoutes().getRouter());

export default router;
