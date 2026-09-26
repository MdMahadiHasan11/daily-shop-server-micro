import { PaginationResult } from "../../../common/interfaces";
import { BaseRepository } from "../../../core/base/base.repository";
import { AppError } from "../../../core/errors/errors";
import { CampaignListQuery } from "./campaign.validator";

export class CampaignRepository extends BaseRepository<"campaign"> {
  constructor() {
    super("campaign");
  }

  async getAllCampaigns(
    query: CampaignListQuery["query"],
  ): Promise<PaginationResult<any>> {
    return await this.getList(query, {
      include: {
        type: true,
        products: true,
      },
    });
  }

  async getCampaignBySlug(slug: string) {
    return await this.model.findUnique({
      where: { slug, isDeleted: false },
      include: {
        type: true,
        products: true,
      },
    });
  }

  async getCampaignDetailsBySlug(slug: string) {
    const campaign = await this.getCampaignBySlug(slug);
    if (!campaign) {
      return null;
    }

    const productIds = [
      ...new Set(campaign.products.map((p) => p.productId).filter(Boolean)),
    ];

    let productDetails: any[] = [];

    try {
      if (productIds.length > 0) {
        const productRes = await this.service.post("product", `/product/bulk`, {
          productIds,
        });

        productDetails = productRes.data || productRes.data || [];
      }
    } catch (err) {
      console.warn("Could not fetch details from product service:", err);
    }

    const enrichedProducts = campaign.products.map((cp) => ({
      ...cp,
      product: productDetails.find((p: any) => p.id === cp.productId) || null,
    }));

    return {
      ...campaign,
      products: enrichedProducts,
    };
  }

  async getCampaignById(id: string) {
    return await this.model.findUnique({
      where: { id },
      include: {
        type: true,
        products: true,
      },
    });
  }

  async createCampaignWithProducts(createData: any) {
    return await this.transaction(async (tx) => {
      const { products, startDate, endDate, ...campaignData } = createData;

      const prismaCreateData: any = {
        ...campaignData,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };

      if (products && products.length > 0) {
        prismaCreateData.products = {
          create: products.map((item: any) => ({
            productId: item.productId,
            productVariantId: item.productVariantId || null,
            discountType: item.discountType,
            discountValue: item.discountValue,
            stockLimit: item.stockLimit || null,
          })),
        };
      }

      return await tx.campaign.create({
        data: prismaCreateData,
        include: {
          type: true,
          products: true,
        },
      });
    });
  }

  async deleteCampaign(id: string, permanent: boolean = false) {
    return await this.transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({ where: { id } });
      if (!campaign) {
        throw new AppError(
          "Campaign not found",
          404,
          true,
          undefined,
          "CAMPAIGN_NOT_FOUND",
        );
      }

      if (permanent) {
        await tx.campaignProduct.deleteMany({ where: { campaignId: id } });
        return await tx.campaign.delete({ where: { id } });
      } else {
        return await tx.campaign.update({
          where: { id },
          data: { isDeleted: true, isActive: false },
        });
      }
    });
  }

  async incrementSoldCount(data: {
    campaignId: string;
    productId: string;
    productVariantId?: string | null;
    quantity: number;
  }) {
    const { campaignId, productId, productVariantId, quantity } = data;

    return await this.transaction(async (tx) => {
      const campaignProduct = await tx.campaignProduct.findFirst({
        where: {
          campaignId,
          productId,
          productVariantId: productVariantId || null,
        },
      });

      if (!campaignProduct) {
        throw new AppError(
          "Campaign product not found",
          404,
          true,
          undefined,
          "CAMPAIGN_PRODUCT_NOT_FOUND",
        );
      }

      if (campaignProduct.stockLimit !== null) {
        const remainingStock =
          campaignProduct.stockLimit - campaignProduct.soldCount;
        if (quantity > remainingStock) {
          throw new AppError(
            `Only ${remainingStock} items left in this campaign stock!`,
            400,
            true,
            undefined,
            "CAMPAIGN_STOCK_OUT",
          );
        }
      }

      return await tx.campaignProduct.update({
        where: { id: campaignProduct.id },
        data: {
          soldCount: { increment: quantity },
        },
      });
    });
  }

  async addProductsToCampaign(campaignId: string, products: any[]) {
    return await this.transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new AppError(
          "Campaign not found",
          404,
          true,
          undefined,
          "CAMPAIGN_NOT_FOUND",
        );
      }

      const createPromises = products.map((item) =>
        tx.campaignProduct.create({
          data: {
            campaignId,
            productId: item.productId,
            productVariantId: item.productVariantId || null,
            discountType: item.discountType,
            discountValue: item.discountValue,
            stockLimit: item.stockLimit || null,
          },
        }),
      );

      await Promise.all(createPromises);

      return await tx.campaign.findUnique({
        where: { id: campaignId },
        include: {
          type: true,
          products: true,
        },
      });
    });
  }

  async updateCampaignWithProducts(id: string, updateData: any) {
    return await this.transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({ where: { id } });
      if (!campaign) {
        throw new AppError(
          "Campaign not found",
          404,
          true,
          undefined,
          "CAMPAIGN_NOT_FOUND",
        );
      }

      const { products, startDate, endDate, ...campaignFields } = updateData;

      const prismaUpdateData: any = { ...campaignFields };
      if (startDate) prismaUpdateData.startDate = new Date(startDate);
      if (endDate) prismaUpdateData.endDate = new Date(endDate);

      await tx.campaign.update({
        where: { id },
        data: prismaUpdateData,
      });

      if (products && Array.isArray(products)) {
        for (const item of products) {
          if (item.action === "DELETE" && item.id) {
            await tx.campaignProduct.deleteMany({
              where: { id: item.id, campaignId: id },
            });
          } else if (item.action === "UPDATE" && item.id) {
            await tx.campaignProduct.update({
              where: { id: item.id },
              data: {
                discountType: item.discountType,
                discountValue: item.discountValue,
                stockLimit: item.stockLimit,
              },
            });
          } else {
            await tx.campaignProduct.create({
              data: {
                campaignId: id,
                productId: item.productId,
                productVariantId: item.productVariantId || null,
                discountType: item.discountType || "PERCENTAGE",
                discountValue: item.discountValue || 0,
                stockLimit: item.stockLimit || null,
              },
            });
          }
        }
      }

      return await tx.campaign.findUnique({
        where: { id },
        include: {
          type: true,
          products: true,
        },
      });
    });
  }
}
