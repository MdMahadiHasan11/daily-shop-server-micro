import { SmsTemplate } from "@prisma/client";
import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { smsSender } from "../../utils/sms-sender.util";
import { SmsRepository } from "./sms.repository";
import {
  CreateSmsTemplateDto,
  SmsLogsListQuery,
  SmsTemplateListQuery,
  UpdateSmsTemplateDto,
} from "./sms.validator";

export interface SendSmsPayload {
  to: string;
  templateName: string;
  payload: Record<string, any>;
}

export class SmsService extends BaseService {
  private readonly repository: SmsRepository;

  constructor() {
    super();
    this.repository = new SmsRepository();
    this.serviceName = "SmsService";
  }

  async sendMessage(options: SendSmsPayload): Promise<boolean> {
    try {
      const template = await this.repository.getTemplateByName(
        options.templateName,
      );
      if (!template) {
        throw new AppError(
          `SMS template '${options.templateName}' not found`,
          404,
          true,
          undefined,
          "SMS_TEMPLATE_NOT_FOUND",
        );
      }

      let finalBody = template.body;

      // Auto extract variables and validate payload
      const variableRegex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
      const requiredFields = new Set<string>();
      let match;
      while ((match = variableRegex.exec(finalBody)) !== null) {
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
          `Missing required SMS template fields: [ ${missingFields.join(", ")} ]`,
          400,
          true,
          undefined,
          "MISSING_SMS_TEMPLATE_FIELDS",
        );
      }

      // Replace placeholders
      for (const [key, value] of Object.entries(options.payload)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        const safeValue = String(value);
        finalBody = finalBody.replace(regex, safeValue);
      }

      await smsSender.sendSms(options.to, finalBody);

      // Save success log
      await this.repository.createLog({
        recipient: options.to,
        message: finalBody,
        status: "SUCCESS",
        templateId: template.id,
      });

      return true;
    } catch (error: any) {
      await this.repository.createLog({
        recipient: options.to,
        message: options.templateName,
        status: "FAILED",
        error: error.message || "Unknown error",
      });
      this._handleError(error, "sendMessage", { options });
      return false;
    }
  }

  async createTemplate(
    data: CreateSmsTemplateDto["body"],
  ): Promise<SmsTemplate> {
    try {
      const existing = await this.repository.getTemplateByName(data.name);
      if (existing) {
        throw new AppError(
          `SMS template with name '${data.name}' already exists`,
          409,
          true,
          undefined,
          "DUPLICATE_SMS_TEMPLATE",
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
    data: UpdateSmsTemplateDto["body"],
  ): Promise<SmsTemplate> {
    try {
      const template = await this.repository.getTemplateById(id);
      if (!template) {
        throw new AppError(
          `SMS template with ID '${id}' not found`,
          404,
          true,
          undefined,
          "SMS_TEMPLATE_NOT_FOUND",
        );
      }

      return await this.repository.updateTemplate(id, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      this._handleError(error, "updateTemplate", { id, data });
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<SmsTemplate> {
    try {
      const template = await this.repository.getTemplateById(id);
      if (!template) {
        throw new AppError(
          `SMS template with ID '${id}' not found`,
          404,
          true,
          undefined,
          "SMS_TEMPLATE_NOT_FOUND",
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
    query: SmsTemplateListQuery["query"],
  ): Promise<PaginationResult<SmsTemplate>> {
    try {
      return await this.repository.getTemplatesList(query);
    } catch (error) {
      this._handleError(error, "getTemplates", { query });
      throw error;
    }
  }

  async getSmsLogs(query: SmsLogsListQuery["query"]) {
    try {
      return await this.repository.getLogsList(query);
    } catch (error) {
      this._handleError(error, "getSmsLogs", { query });
      throw error;
    }
  }
}
