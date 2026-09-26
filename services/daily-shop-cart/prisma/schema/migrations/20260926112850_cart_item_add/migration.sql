-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DOUBLE PRECISION;
