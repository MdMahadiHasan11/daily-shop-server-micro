import { Router } from "express";

import { authConfig } from "../../core/config/auth.config";
import { AuthRoutes } from "../modules/auth/auth.routes";

const router = Router();
router.use("/", authConfig.authLimiter, new AuthRoutes().getRouter());

export default router;
