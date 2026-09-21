-- CreateTable
CREATE TABLE "expired_stock_batches" (
    "id" TEXT NOT NULL,
    "originalBatchId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiredQuantity" INTEGER NOT NULL,
    "purchasePrice" DOUBLE PRECISION,
    "mfgDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "reason" TEXT NOT NULL DEFAULT 'Automatic expired by midnight cron job',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expired_stock_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expired_stock_batches_productVariantId_idx" ON "expired_stock_batches"("productVariantId");

-- CreateIndex
CREATE INDEX "expired_stock_batches_warehouseId_idx" ON "expired_stock_batches"("warehouseId");

-- CreateIndex
CREATE INDEX "expired_stock_batches_expiryDate_idx" ON "expired_stock_batches"("expiryDate");

-- AddForeignKey
ALTER TABLE "expired_stock_batches" ADD CONSTRAINT "expired_stock_batches_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expired_stock_batches" ADD CONSTRAINT "expired_stock_batches_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
