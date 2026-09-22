import { Router } from "express";
import { PaymentRoutes } from "../modules/payment/payment.routes";
import { SSLRoutes } from "../modules/ssl/ssl.routes";

const router = Router();
router.use("/data", new PaymentRoutes().getRouter());
router.use("/ssl", new SSLRoutes().getRouter());

export default router;
