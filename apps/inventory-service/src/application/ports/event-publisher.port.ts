export interface DomainEvent {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export const EVENT_PUBLISHER_PORT = Symbol('EVENT_PUBLISHER_PORT');

export interface IEventPublisherPort {
  publish(event: DomainEvent): Promise<void>;
}
