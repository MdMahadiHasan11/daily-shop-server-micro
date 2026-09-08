import { SmsTemplate } from "@prisma/client";
import { PaginationResult } from "../../../common/interfaces";
import { BaseRepository } from "../../../core/base/base.repository";
import { CreateSmsTemplateDto, UpdateSmsTemplateDto } from "./sms.validator";

export class SmsRepository extends BaseRepository<"smsTemplate"> {
  constructor() {
    super("smsTemplate");
  }

  async getTemplateById(id: string): Promise<SmsTemplate | null> {
    return await this.model.findFirst({
      where: { id, isDeleted: false },
    });
  }

  async getTemplateByName(name: string): Promise<SmsTemplate | null> {
    return await this.model.findFirst({
      where: { name, isDeleted: false },
    });
  }

  async createTemplate(
    data: CreateSmsTemplateDto["body"],
  ): Promise<SmsTemplate> {
    return await this.model.create({ data });
  }

  async updateTemplate(
    id: string,
    data: UpdateSmsTemplateDto["body"],
  ): Promise<SmsTemplate> {
    return await this.model.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string): Promise<SmsTemplate> {
    return await this.model.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async getTemplatesList(query: any): Promise<PaginationResult<SmsTemplate>> {
    return await this.getList(query);
  }

  async createLog(data: {
    recipient: string;
    message: string;
    status: string;
    error?: string;
    templateId?: string;
  }): Promise<any> {
    const logModel = (this.db as any).smsLog;
    if (logModel) {
      return await logModel.create({ data });
    }
    return null;
  }

  async getLogsList(query: any): Promise<any> {
    return await this.getListByModelName("smsLog", query);
  }
}
