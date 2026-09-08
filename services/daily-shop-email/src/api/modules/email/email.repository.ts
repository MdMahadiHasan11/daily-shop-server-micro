import { EmailTemplate } from "@prisma/client";
import { PaginationResult } from "../../../common/interfaces";
import { BaseRepository } from "../../../core/base/base.repository";
import { CreateTemplateDto, UpdateTemplateDto } from "./email.validator";

export class EmailRepository extends BaseRepository<"emailTemplate"> {
  constructor() {
    super("emailTemplate");
  }

  async getTemplateById(id: string): Promise<EmailTemplate | null> {
    return await this.model.findFirst({
      where: { id, isDeleted: false },
    });
  }

  async getTemplateByName(name: string): Promise<EmailTemplate | null> {
    return await this.model.findFirst({
      where: { name, isDeleted: false },
    });
  }

  async createTemplate(
    data: CreateTemplateDto["body"],
  ): Promise<EmailTemplate> {
    return await this.model.create({ data });
  }

  async updateTemplate(
    id: string,
    data: UpdateTemplateDto["body"],
  ): Promise<EmailTemplate> {
    return await this.model.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string): Promise<EmailTemplate> {
    return await this.model.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async getTemplatesList(query: any): Promise<PaginationResult<EmailTemplate>> {
    return await this.getList(query);
  }

  async createLog(data: {
    recipient: string;
    subject: string;
    status: string;
    error?: string;
    templateId?: string;
  }): Promise<any> {
    const logModel = (this.db as any).emailLog;
    if (logModel) {
      return await logModel.create({ data });
    }
    return null;
  }

  async getLogsList(query: any): Promise<any> {
    return await this.getListByModelName("emailLog", query);
  }
}
