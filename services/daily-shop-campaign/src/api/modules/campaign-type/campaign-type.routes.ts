import { BaseRoutes } from "../../../core/base/base.routes";
import { CampaignTypeController } from "./campaign-type.controller";
import { CampaignTypeValidators } from "./campaign-type.validator";

export class CampaignTypeRoutes extends BaseRoutes<CampaignTypeController> {
  constructor() {
    super(new CampaignTypeController());
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CampaignTypeValidators.listCampaignTypes),
      this.controller.getAll,
    );

    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CampaignTypeValidators.campaignTypeIdParam),
      this.controller.getById,
    );

    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CampaignTypeValidators.createCampaignType),
      this.controller.create,
    );

    this.router.patch(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CampaignTypeValidators.updateCampaignType),
      this.controller.update,
    );

    this.router.delete(
      "/:id/soft",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CampaignTypeValidators.campaignTypeIdParam),
      this.controller.softDelete,
    );

    this.router.delete(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CampaignTypeValidators.campaignTypeIdParam),
      this.controller.hardDelete,
    );
  }
}
