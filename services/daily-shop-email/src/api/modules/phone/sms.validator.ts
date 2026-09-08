import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class SmsValidators extends BaseValidator {
  static getIdSchema = z.object({
    params: z.object({
      id: z.string().uuid("Invalid ID format"),
    }),
  });

  static createTemplateSchema = z.object({
    body: z.object({
      name: z.string().min(1, "Template name is required"),
      description: z.string().optional(),
      body: z.string().min(1, "SMS body content is required"),
    }),
  });

  static updateTemplateSchema = z.object({
    params: z.object({
      id: z.string().uuid("Invalid template ID"),
    }),
    body: z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      body: z.string().min(1).optional(),
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
    query: this.pagination(["message"]).safeExtend({
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["message"]),
    }),
  });
}

export type IdParams = z.infer<typeof SmsValidators.getIdSchema>;
export type CreateSmsTemplateDto = z.infer<
  typeof SmsValidators.createTemplateSchema
>;
export type UpdateSmsTemplateDto = z.infer<
  typeof SmsValidators.updateTemplateSchema
>;
export type SmsTemplateListQuery = z.infer<
  typeof SmsValidators.listTemplateQuery
>;
export type SmsLogsListQuery = z.infer<typeof SmsValidators.listLogsQuery>;
