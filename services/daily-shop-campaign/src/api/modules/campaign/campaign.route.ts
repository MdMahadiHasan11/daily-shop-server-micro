import { BaseRoutes } from "../../../core/base/base.routes";
import { CampaignController } from "./campaign.controller";

import { CampaignValidators } from "./campaign.validator";

export class CampaignRoutes extends BaseRoutes<CampaignController> {
  constructor() {
    super(new CampaignController());
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CampaignValidators.listCampaigns),
      this.controller.getAllCampaigns,
    );

    this.router.get(
      "/:slug",
      this.validateService.allow(["gateway"]),
      this.controller.getCampaignBySlug,
    );

    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CampaignValidators.createCampaign),
      this.controller.createCampaign,
    );

    this.router.post(
      "/stock/update",
      this.validateService.allow(["gateway", "order"]),
      this.validateRequest(CampaignValidators.updateStock),
      this.controller.updateStock,
    );

    this.router.patch(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CampaignValidators.updateCampaign),
      this.controller.updateCampaign,
    );

    this.router.delete(
      "/:id/soft",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CampaignValidators.campaignIdParam),
      this.controller.softDeleteCampaign,
    );

    this.router.delete(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CampaignValidators.campaignIdParam),
      this.controller.hardDeleteCampaign,
    );

    this.router.post(
      "/:id/products",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CampaignValidators.addProductsToCampaign),
      this.controller.addProductsToCampaign,
    );
  }
}
