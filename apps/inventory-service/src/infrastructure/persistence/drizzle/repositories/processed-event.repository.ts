import type { IProcessedEventRepository } from '../../../../domain/repositories/processed-event.repository.interface'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { processedEvents } from '../schema'

export class DrizzleProcessedEventRepository implements IProcessedEventRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async tryMarkProcessed(eventId: string, eventType: string): Promise<boolean> {
    const inserted = await this.db
      .insert(processedEvents)
      .values({ eventId, eventType })
      .onConflictDoNothing({ target: processedEvents.eventId })
      .returning({ eventId: processedEvents.eventId });
    return inserted.length > 0;
  }
}
