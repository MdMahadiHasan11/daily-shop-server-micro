import { Router } from "express";
import { CampaignTypeRoutes } from "../modules/campaign-type/campaign-type.routes";
import { CampaignRoutes } from "../modules/campaign/campaign.route";

const router = Router();
// router.use(authenticate);
router.use("/data", new CampaignRoutes().getRouter());
router.use("/types", new CampaignTypeRoutes().getRouter());

export default router;
