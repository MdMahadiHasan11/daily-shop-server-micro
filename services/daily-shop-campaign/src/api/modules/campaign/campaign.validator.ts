import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

const campaignProductSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  productVariantId: z.string().optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.number().positive("Discount value must be positive"),
  stockLimit: z.number().int().positive().optional().nullable(),
});

const updateCampaignProductSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product ID is required").optional(),
  productVariantId: z.string().optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
  discountValue: z
    .number()
    .positive("Discount value must be positive")
    .optional(),
  stockLimit: z.number().int().positive().optional().nullable(),
  action: z.enum(["CREATE", "UPDATE", "DELETE"]).default("CREATE"),
});

export class CampaignValidators extends BaseValidator {
  static listCampaigns = z.object({
    query: this.pagination(["title", "slug"]).safeExtend({
      typeId: z.string().optional(),
      slug: z.string().optional(),
      isActive: z
        .string()
        .transform((val) => val === "true")
        .optional(),
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["title"]),
    }),
  });

  static createCampaign = z.object({
    body: z.object({
      title: z.string().min(1, "Campaign title is required"),
      slug: z.string().min(1, "Slug is required"),
      description: z.string().optional().nullable(),
      typeId: z.string().min(1, "Campaign Type ID is required"),
      bannerUrl: z.string().url().optional().nullable(),
      badgeText: z.string().optional().nullable(),
      badgeColor: z.string().optional().nullable(),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      isActive: z.boolean().optional(),
      // Support both single object or array of products
      products: z
        .union([campaignProductSchema, z.array(campaignProductSchema)])
        .optional()
        .transform((val) => {
          if (!val) return [];
          return Array.isArray(val) ? val : [val];
        }),
    }),
  });

  static updateCampaign = z.object({
    params: z.object({
      id: z.string().min(1, "Campaign ID is required"),
    }),
    body: z.object({
      title: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      typeId: z.string().min(1).optional(),
      bannerUrl: z.string().url().optional().nullable(),
      badgeText: z.string().optional().nullable(),
      badgeColor: z.string().optional().nullable(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      isActive: z.boolean().optional(),
      products: z
        .union([
          updateCampaignProductSchema,
          z.array(updateCampaignProductSchema),
        ])
        .optional()
        .transform((val) => {
          if (!val) return undefined;
          return Array.isArray(val) ? val : [val];
        }),
    }),
  });

  static campaignIdParam = z.object({
    params: z.object({
      id: z.string().min(1, "Campaign ID is required"),
    }),
  });

  static updateStock = z.object({
    body: z.object({
      campaignId: z.string().min(1, "Campaign ID is required"),
      productId: z.string().min(1, "Product ID is required"),
      productVariantId: z.string().optional().nullable(),
      quantity: z.number().int().positive("Quantity must be greater than zero"),
    }),
  });

  static addProductsToCampaign = z.object({
    params: z.object({
      id: z.string().min(1, "Campaign ID is required"),
    }),
    body: z.object({
      products: z
        .union([campaignProductSchema, z.array(campaignProductSchema)])
        .transform((val) => (Array.isArray(val) ? val : [val])),
    }),
  });
}

export type CampaignListQuery = z.infer<
  typeof CampaignValidators.listCampaigns
>;
export type CreateCampaign = z.infer<typeof CampaignValidators.createCampaign>;
export type UpdateCampaign = z.infer<typeof CampaignValidators.updateCampaign>;
export type AddCampaignProducts = z.infer<
  typeof CampaignValidators.addProductsToCampaign
>;
