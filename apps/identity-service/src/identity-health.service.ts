import type { ClientKafka } from "@nestjs/microservices";
import { sql } from "drizzle-orm";
import type { DrizzleTransactionHost } from "./infrastructure/persistence/drizzle/drizzle.provider";

const HEALTH_TIMEOUT_MS = 2_000;

export class IdentityHealthService {
  constructor(
    private readonly session: DrizzleTransactionHost,
    private readonly kafkaClient: ClientKafka,
  ) {}

  async checkReadiness(): Promise<void> {
    await Promise.all([
      this.withTimeout(this.session.db.execute(sql`select 1`), "postgres"),
      this.withTimeout(this.kafkaClient.connect(), "kafka"),
    ]);
  }

  private async withTimeout<T>(promise: Promise<T>, dependency: string): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(
            () => reject(new Error(`${dependency} health check timed out`)),
            HEALTH_TIMEOUT_MS,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
