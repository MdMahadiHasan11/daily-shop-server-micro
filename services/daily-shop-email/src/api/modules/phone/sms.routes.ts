import { BaseRoutes } from "../../../core/base/base.routes";
import { SmsController } from "./sms.controller";
import { SmsValidators } from "./sms.validator";

export class SmsRoutes extends BaseRoutes<SmsController> {
  constructor() {
    super(new SmsController());
  }

  protected registerRoutes(): void {
    this.router.post(
      "/templates",
      this.validateRequest(SmsValidators.createTemplateSchema),
      this.controller.createTemplate,
    );

    this.router.patch(
      "/templates/:id",
      this.validateRequest(SmsValidators.updateTemplateSchema),
      this.controller.updateTemplate,
    );

    this.router.delete(
      "/templates/:id",
      this.validateRequest(SmsValidators.getIdSchema),
      this.controller.deleteTemplate,
    );

    this.router.get(
      "/templates",
      this.validateRequest(SmsValidators.listTemplateQuery),
      this.controller.getTemplates,
    );

    this.router.get(
      "/logs",
      this.validateRequest(SmsValidators.listLogsQuery),
      this.controller.getSmsLogs,
    );
  }
}
