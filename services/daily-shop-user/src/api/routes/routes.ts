import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();
// router.use(authenticate);
router.use("/", new UserRoutes().getRouter());

export default router;
