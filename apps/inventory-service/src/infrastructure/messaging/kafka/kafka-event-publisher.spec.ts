import type { IOutboxRepository } from "../../../domain/repositories/outbox.repository.interface";
import { CorrelationContext } from "../../correlation/correlation-context";
import { KafkaEventPublisher } from "./kafka-event-publisher";

describe("KafkaEventPublisher", () => {
  const outbox = () => ({
    save: jest.fn(),
    claimUnpublished: jest.fn(),
    renewClaim: jest.fn(),
    markAsPublished: jest.fn(),
    releaseClaim: jest.fn(),
  } satisfies IOutboxRepository);
  const event = {
    aggregateType: "Product",
    aggregateId: crypto.randomUUID(),
    eventType: "product.created",
    payload: {},
  };

  it("stamps the active correlation id onto the outbox record", async () => {
    const repository = outbox();
    const correlation = new CorrelationContext();
    const publisher = new KafkaEventPublisher(repository, correlation);
    await correlation.run("corr-123", () => publisher.publish(event));
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: "corr-123" }),
    );
  });

  it("writes null when no correlation context is active", async () => {
    const repository = outbox();
    const publisher = new KafkaEventPublisher(repository, new CorrelationContext());
    await publisher.publish(event);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: null }),
    );
  });
});
