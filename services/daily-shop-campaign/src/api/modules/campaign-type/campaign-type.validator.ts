import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class CampaignTypeValidators extends BaseValidator {
  static listCampaignTypes = z.object({
    query: this.pagination(["name"]).safeExtend({
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["name"]),
    }),
  });

  static createCampaignType = z.object({
    body: z.object({
      name: z.string().min(1, "Campaign type name is required"),
      slug: z.string().min(1, "Slug is required"),
      description: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    }),
  });

  static updateCampaignType = z.object({
    params: z.object({
      id: z.string().min(1, "Campaign Type ID is required"),
    }),
    body: z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    }),
  });

  static campaignTypeIdParam = z.object({
    params: z.object({
      id: z.string().min(1, "Campaign Type ID is required"),
    }),
  });
}

export type CampaignTypeListQuery = z.infer<
  typeof CampaignTypeValidators.listCampaignTypes
>;
export type CreateCampaignType = z.infer<
  typeof CampaignTypeValidators.createCampaignType
>;
export type UpdateCampaignType = z.infer<
  typeof CampaignTypeValidators.updateCampaignType
>;
