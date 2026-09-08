import { Router } from "express";
import { EmailRoutes } from "../modules/email/email.routes";
import { SmsRoutes } from "../modules/phone/sms.routes";

const router = Router();
router.use("/email", new EmailRoutes().getRouter());
router.use("/phone", new SmsRoutes().getRouter());
export default router;
