export interface ConsumedEvent {
  /** Dedup anahtarı: üretici event-id header'ı ya da topic-partition-offset. */
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface IConsumedEventHandler {
  handle(event: ConsumedEvent): Promise<void>;
}
