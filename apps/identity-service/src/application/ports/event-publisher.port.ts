export interface DomainEvent {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface IEventPublisherPort {
  publish(event: DomainEvent): Promise<void>;
}
