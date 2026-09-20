import { Router } from "express";
import { OrderRoutes } from "../modules/order/order.routes";

const router = Router();
// router.use(authenticate);
router.use("/", new OrderRoutes().getRouter());

export default router;
