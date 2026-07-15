import type { ClientKafka } from "@nestjs/microservices";
import { of, Subject } from "rxjs";
import type { IUnitOfWorkPort } from "../../../application/ports/unit-of-work.port";
import type {
  IOutboxRepository,
  OutboxEvent,
} from "../../../domain/repositories/outbox.repository.interface";
import { OutboxPublisherWorker } from "./outbox-publisher.worker";

describe("OutboxPublisherWorker", () => {
  const event: OutboxEvent = {
    id: "00000000-0000-4000-8000-000000000001",
    aggregateType: "Product",
    aggregateId: "00000000-0000-4000-8000-000000000002",
    eventType: "product.created",
    payload: { id: "00000000-0000-4000-8000-000000000002" },
    correlationId: "00000000-0000-4000-8000-00000000c0de",
    createdAt: new Date("2026-07-12T00:00:00Z"),
    publishedAt: null,
  };

  it("commits the claim transaction before calling Kafka", async () => {
    let insideTransaction = false;
    const repository = {
      save: jest.fn(),
      claimUnpublished: jest.fn().mockResolvedValue([event]),
      renewClaim: jest.fn().mockResolvedValue(true),
      markAsPublished: jest.fn().mockResolvedValue(undefined),
      releaseClaim: jest.fn(),
    } satisfies IOutboxRepository;
    const unitOfWork = {
      run: jest.fn(async <T>(work: () => Promise<T>) => {
        insideTransaction = true;
        const result = await work();
        insideTransaction = false;
        return result;
      }),
    } satisfies IUnitOfWorkPort;
    const kafkaClient = {
      emit: jest.fn(() => {
        expect(insideTransaction).toBe(false);
        return of(undefined);
      }),
    };
    const worker = new OutboxPublisherWorker(
      repository,
      kafkaClient as unknown as ClientKafka,
      unitOfWork,
      "worker-1",
    );

    await worker.poll();

    expect(repository.claimUnpublished).toHaveBeenCalledWith(
      50,
      "worker-1",
      expect.any(Date),
    );
    expect(repository.markAsPublished).toHaveBeenCalledWith(
      event.id,
      "worker-1",
    );
  });

  it("does not overlap polls in the same process", async () => {
    const pendingSend = new Subject<void>();
    const repository = {
      save: jest.fn(),
      claimUnpublished: jest.fn().mockResolvedValue([event]),
      renewClaim: jest.fn().mockResolvedValue(true),
      markAsPublished: jest.fn().mockResolvedValue(undefined),
      releaseClaim: jest.fn(),
    } satisfies IOutboxRepository;
    const unitOfWork = {
      run: jest.fn(async <T>(work: () => Promise<T>) => work()),
    } satisfies IUnitOfWorkPort;
    const kafkaClient = { emit: jest.fn(() => pendingSend) };
    const worker = new OutboxPublisherWorker(
      repository,
      kafkaClient as unknown as ClientKafka,
      unitOfWork,
      "worker-1",
    );

    const firstPoll = worker.poll();
    await Promise.resolve();
    await worker.poll();
    expect(repository.claimUnpublished).toHaveBeenCalledTimes(1);

    pendingSend.next();
    pendingSend.complete();
    await firstPoll;
  });
});
