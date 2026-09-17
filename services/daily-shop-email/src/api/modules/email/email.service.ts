import { EmailTemplate } from "@prisma/client";
import { PaginationResult } from "../../../common/interfaces";

import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";

import { env } from "../../../core/config/env.config";
import { emailSender } from "../../utils/email-sender.util";
import { EmailRepository } from "./email.repository";
import {
  CreateTemplateDto,
  LogsListQuery,
  TemplateListQuery,
  UpdateTemplateDto,
} from "./email.validator";

export interface SendEmailPayload {
  to: string;
  templateName: string;
  payload: Record<string, any>;
  attachmentHtml?: string;
  pdfFilename?: string;
}

export class EmailService extends BaseService {
  private readonly repository: EmailRepository;

  constructor() {
    super();
    this.repository = new EmailRepository();
    this.serviceName = "EmailService";
  }

  async sendEmail(options: SendEmailPayload): Promise<boolean> {
    let templateId: string | null = null;
    let finalSubject = "";

    try {
      const template = await this.repository.getTemplateByName(
        options.templateName,
      );
      if (!template) {
        throw new AppError(
          `Email template '${options.templateName}' not found`,
          404,
          true,
          undefined,
          "TEMPLATE_NOT_FOUND",
        );
      }

      templateId = template.id;
      finalSubject = template.subject;
      let finalHtml = template.htmlBody;
      let finalText = template.textBody || "";

      finalHtml = emailSender.compileTemplate(finalHtml, options.payload);
      finalSubject = emailSender.compileTemplate(finalSubject, options.payload);
      if (finalText) {
        finalText = emailSender.compileTemplate(finalText, options.payload);
      }

      const attachments: any[] = [];
      if (options.attachmentHtml) {
        const pdfBuffer = await emailSender.generatePdfFromHtml(
          options.attachmentHtml,
        );
        attachments.push({
          filename: options.pdfFilename || `${options.templateName}.pdf`,
          content: pdfBuffer,
        });
      }

      await emailSender.sendMail({
        from: `Daily Shop <${env.SMTP_EMAIL}>`,
        to: options.to,
        subject: finalSubject,
        html: finalHtml,
        text: finalText || undefined,
        attachments,
      });

      await this.repository.createLog({
        recipient: options.to,
        subject: finalSubject,
        status: "SUCCESS",
        templateId: template.id,
      });

      return true;
    } catch (error: any) {
      await this.repository.createLog({
        recipient: options.to,
        subject: options.templateName,
        status: "FAILED",
        error: error.message || "Unknown error",
        templateId: templateId || "unknown",
      });

      this._handleError(error, "sendEmail", { options });
      return false;
    }
  }

  async createTemplate(
    data: CreateTemplateDto["body"],
  ): Promise<EmailTemplate> {
    try {
      const existing = await this.repository.getTemplateByName(data.name);
      if (existing) {
        throw new AppError(
          `Template with name '${data.name}' already exists`,
          409,
          true,
          undefined,
          "DUPLICATE_TEMPLATE",
        );
      }

      return await this.repository.createTemplate(data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      this._handleError(error, "createTemplate", { data });
      throw error;
    }
  }

  async updateTemplate(
    id: string,
    data: UpdateTemplateDto["body"],
  ): Promise<EmailTemplate> {
    try {
      const template = await this.repository.getTemplateById(id);
      if (!template) {
        throw new AppError(
          `Email template with ID '${id}' not found`,
          404,
          true,
          undefined,
          "TEMPLATE_NOT_FOUND",
        );
      }

      return await this.repository.updateTemplate(id, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      this._handleError(error, "updateTemplate", { id, data });
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<EmailTemplate> {
    try {
      const template = await this.repository.getTemplateById(id);
      if (!template) {
        throw new AppError(
          `Email template with ID '${id}' not found`,
          404,
          true,
          undefined,
          "TEMPLATE_NOT_FOUND",
        );
      }

      return await this.repository.deleteTemplate(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      this._handleError(error, "deleteTemplate", { id });
      throw error;
    }
  }

  async getTemplates(
    query: TemplateListQuery["query"],
  ): Promise<PaginationResult<EmailTemplate>> {
    try {
      return await this.repository.getTemplatesList(query);
    } catch (error) {
      this._handleError(error, "getTemplates", { query });
      throw error;
    }
  }

  async getEmailLogs(query: LogsListQuery["query"]) {
    try {
      return await this.repository.getLogsList(query);
    } catch (error) {
      this._handleError(error, "getEmailLogs", { query });
      throw error;
    }
  }
}
