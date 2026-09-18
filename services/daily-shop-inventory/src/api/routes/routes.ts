import { Router } from "express";
import { WarehouseRoutes } from "../modules/warehouse/warehouse.routes";
import { SupplierRoutes } from "../modules/supplier/supplier.routes";
import { StockLevelRoutes } from "../modules/stock-level/stock-level.routes";


const router = Router();
router.use("/warehouse", new WarehouseRoutes().getRouter());
router.use("/supplier", new SupplierRoutes().getRouter());
router.use("/stock-level", new StockLevelRoutes().getRouter());

export default router;
