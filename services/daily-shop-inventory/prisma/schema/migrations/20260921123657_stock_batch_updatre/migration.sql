-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'EXHAUSTED', 'DAMAGED', 'QUARANTINED');

-- AlterTable
ALTER TABLE "stock_batches" ADD COLUMN     "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "stock_batches_status_idx" ON "stock_batches"("status");
