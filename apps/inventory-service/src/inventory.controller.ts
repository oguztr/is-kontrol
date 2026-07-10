import { Controller, Get } from "@nestjs/common";

@Controller()
export class InventoryController {
  @Get("health")
  health() {
    return { status: "ok", service: "inventory-service" };
  }
}
