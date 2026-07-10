import { Module } from "@nestjs/common";
import { ProductsController } from "./interface/http/controllers/products.controller";
import { WarehousesController } from "./interface/http/controllers/warehouses.controller";
import { UnitsController } from "./interface/http/controllers/units.controller";
import { StockDocumentsController } from "./interface/http/controllers/stock-documents.controller";
import { StockMovementsController } from "./interface/http/controllers/stock-movements.controller";
import { StockBalancesController } from "./interface/http/controllers/stock-balances.controller";
import { KafkaModule } from "./infrastructure/messaging/kafka/kafka.module";

@Module({
  imports: [KafkaModule],
  controllers: [
    ProductsController,
    WarehousesController,
    UnitsController,
    StockDocumentsController,
    StockMovementsController,
    StockBalancesController,
  ],
  providers: [],
})
export class InventoryModule {}
