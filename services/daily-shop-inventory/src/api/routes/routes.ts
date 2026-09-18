import { Router } from "express";
import { WarehouseRoutes } from "../modules/warehouse/warehouse.routes";
import { SupplierRoutes } from "../modules/supplier/supplier.routes";
import { StockLevelRoutes } from "../modules/stock-level/stock-level.routes";
import { StockBatchRoutes } from "../modules/stock-batch/stock-batch.routes";
import { PurchaseOrderRoutes } from "../modules/purchase-order/purchase-order.routes";
import { StockTransactionRoutes } from "../modules/stock-transaction/stock-transaction.routes";
import { StockTransferRoutes } from "../modules/stock-transfer/stock-transfer.routes";
import { ProductSyncRoutes } from "../modules/product-sync/product-sync.routes";


const router = Router();
router.use("/warehouse", new WarehouseRoutes().getRouter());
router.use("/supplier", new SupplierRoutes().getRouter());
router.use("/stock-level", new StockLevelRoutes().getRouter());
router.use("/stock-batch", new StockBatchRoutes().getRouter());
router.use("/purchase-order", new PurchaseOrderRoutes().getRouter());
router.use("/stock-transaction", new StockTransactionRoutes().getRouter());
router.use("/stock-transfer", new StockTransferRoutes().getRouter());
router.use("/product-sync", new ProductSyncRoutes().getRouter());

export default router;
