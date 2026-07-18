import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { IdentityHealthService } from "./identity-health.service";

@Controller()
export class IdentityController {
  constructor(private readonly healthService: IdentityHealthService) {}

  @Get("health")
  health() {
    return { status: "ok", service: "identity-service" };
  }

  @Get("health/live")
  liveness() {
    return { status: "ok", service: "identity-service" };
  }

  @Get("health/ready")
  async readiness() {
    try {
      await this.healthService.checkReadiness();
      return { status: "ready", service: "identity-service" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dependency unavailable";
      throw new ServiceUnavailableException({
        status: "not-ready",
        service: "identity-service",
        message,
      });
    }
  }
}
