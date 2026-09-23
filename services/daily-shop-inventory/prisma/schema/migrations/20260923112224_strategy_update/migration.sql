-- CreateEnum
CREATE TYPE "VariantStrategy" AS ENUM ('FEFO_FIRST', 'COST_FIRST', 'CENTRAL_HUB_FIRST');

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "strategy" "VariantStrategy" NOT NULL DEFAULT 'FEFO_FIRST';
