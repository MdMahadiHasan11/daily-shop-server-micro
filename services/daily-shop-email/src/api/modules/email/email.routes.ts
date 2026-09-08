import { BaseRoutes } from "../../../core/base/base.routes";
import { EmailController } from "./email.controller";
import { EmailValidators } from "./email.validator";

export class EmailRoutes extends BaseRoutes<EmailController> {
  constructor() {
    super(new EmailController());
  }

  protected registerRoutes(): void {
    this.router.post(
      "/templates",
      this.validateRequest(EmailValidators.createTemplateSchema),
      this.controller.createTemplate,
    );

    this.router.patch(
      "/templates/:id",
      this.validateRequest(EmailValidators.updateTemplateSchema),
      this.controller.updateTemplate,
    );

    this.router.delete(
      "/templates/:id",
      this.validateRequest(EmailValidators.getIdSchema),
      this.controller.deleteTemplate,
    );

    this.router.get(
      "/templates",
      this.validateRequest(EmailValidators.listTemplateQuery),
      this.controller.getTemplates,
    );

    this.router.get(
      "/logs",
      this.validateRequest(EmailValidators.listLogsQuery),
      this.controller.getEmailLogs,
    );
  }
}
