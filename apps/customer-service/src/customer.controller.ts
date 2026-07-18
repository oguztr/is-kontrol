import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { CustomerHealthService } from "./customer-health.service";

@Controller()
export class CustomerController {
  constructor(private readonly healthService: CustomerHealthService) {}

  @Get("health")
  health() {
    return { status: "ok", service: "customer-service" };
  }

  @Get("health/live")
  liveness() {
    return { status: "ok", service: "customer-service" };
  }

  @Get("health/ready")
  async readiness() {
    try {
      await this.healthService.checkReadiness();
      return { status: "ready", service: "customer-service" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dependency unavailable";
      throw new ServiceUnavailableException({
        status: "not-ready",
        service: "customer-service",
        message,
      });
    }
  }
}
