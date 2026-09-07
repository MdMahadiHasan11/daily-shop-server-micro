import { Router } from "express";
// import { authenticate } from "../middlewares/authentication.middleware";
import { authConfig } from "../../core/config/auth.config";
import { AuthRoutes } from "../modules/auth/auth.routes";

const router = Router();
router.use("/", authConfig.authLimiter, new AuthRoutes().getRouter());
// router.use(authenticate);

export default router;
