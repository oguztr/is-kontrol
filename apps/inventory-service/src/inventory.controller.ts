import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { InventoryHealthService } from "./inventory-health.service";

@Controller()
export class InventoryController {
  constructor(private readonly healthService: InventoryHealthService) {}

  @Get("health")
  health() {
    return { status: "ok", service: "inventory-service" };
  }

  @Get("health/live")
  liveness() {
    return { status: "ok", service: "inventory-service" };
  }

  @Get("health/ready")
  async readiness() {
    try {
      await this.healthService.checkReadiness();
      return { status: "ready", service: "inventory-service" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dependency unavailable";
      throw new ServiceUnavailableException({
        status: "not-ready",
        service: "inventory-service",
        message,
      });
    }
  }
}
