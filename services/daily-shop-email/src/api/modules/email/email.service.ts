import { EmailTemplate } from "@prisma/client";
// import nodemailer from "nodemailer";
import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
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
}

export class EmailService extends BaseService {
  private readonly repository: EmailRepository;
  // private transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.repository = new EmailRepository();
    this.serviceName = "EmailService";

    // this.transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    //   port: Number(process.env.SMTP_PORT) || 2525,
    //   auth: {
    //     user: process.env.SMTP_USER || "",
    //     pass: process.env.SMTP_PASS || "",
    //   },
    // });
  }

  async sendEmail(options: SendEmailPayload): Promise<boolean> {
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

      let finalSubject = template.subject;
      let finalHtml = template.htmlBody;
      let finalText = template.textBody || "";

      // Auto extract variables and validate payload
      const variableRegex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
      const requiredFields = new Set<string>();
      let match;
      while (
        (match = variableRegex.exec(finalHtml + " " + finalSubject)) !== null
      ) {
        requiredFields.add(match[1]);
      }

      const missingFields: string[] = [];
      for (const field of requiredFields) {
        if (
          !options.payload ||
          options.payload[field] === undefined ||
          options.payload[field] === null
        ) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        throw new AppError(
          `Missing required template fields: [ ${missingFields.join(", ")} ]`,
          400,
          true,
          undefined,
          "MISSING_TEMPLATE_FIELDS",
        );
      }

      // Replace placeholders
      for (const [key, value] of Object.entries(options.payload)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        const safeValue = String(value);
        finalSubject = finalSubject.replace(regex, safeValue);
        finalHtml = finalHtml.replace(regex, safeValue);
        if (finalText) finalText = finalText.replace(regex, safeValue);
      }

      // Send mail via Nodemailer
      // await this.transporter.sendMail({
      //   from: process.env.EMAIL_FROM || '"App Support" <no-reply@app.com>',
      //   to: options.to,
      //   subject: finalSubject,
      //   html: finalHtml,
      //   text: finalText || undefined,
      // });

      console.log("----------------here phone service-------------");

      // Save success log
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
