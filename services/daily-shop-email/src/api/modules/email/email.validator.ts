import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class EmailValidators extends BaseValidator {
  static getIdSchema = z.object({
    params: z.object({
      id: z.string().uuid("Invalid ID format"),
    }),
  });

  static createTemplateSchema = z.object({
    body: z.object({
      name: z.string().min(1, "Template name is required"),
      description: z.string().optional(),
      subject: z.string().min(1, "Subject is required"),
      htmlBody: z.string().min(1, "HTML body is required"),
      textBody: z.string().optional(),
    }),
  });

  static updateTemplateSchema = z.object({
    params: z.object({
      id: z.string().uuid("Invalid template ID"),
    }),
    body: z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      subject: z.string().min(1).optional(),
      htmlBody: z.string().min(1).optional(),
      textBody: z.string().optional(),
    }),
  });

  static listTemplateQuery = z.object({
    query: this.pagination(["name"]).safeExtend({
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["name"]),
    }),
  });
  static listLogsQuery = z.object({
    query: this.pagination(["subject"]).safeExtend({
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["subject"]),
    }),
  });
}

export type IdParams = z.infer<typeof EmailValidators.getIdSchema>;
export type CreateTemplateDto = z.infer<
  typeof EmailValidators.createTemplateSchema
>;
export type UpdateTemplateDto = z.infer<
  typeof EmailValidators.updateTemplateSchema
>;
export type TemplateListQuery = z.infer<
  typeof EmailValidators.listTemplateQuery
>;

export type LogsListQuery = z.infer<typeof EmailValidators.listLogsQuery>;
