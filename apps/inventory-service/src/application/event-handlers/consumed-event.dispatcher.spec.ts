import type { IProcessedEventRepository } from "../../domain/repositories/processed-event.repository.interface";
import type { IUnitOfWorkPort } from "../ports/unit-of-work.port";
import type { IConsumedEventHandler } from "./consumed-event";
import { ConsumedEventDispatcher } from "./consumed-event.dispatcher";

describe("ConsumedEventDispatcher", () => {
  it("does not invoke a handler for a duplicate event", async () => {
    const processed = {
      tryMarkProcessed: jest.fn().mockResolvedValue(false),
    } satisfies IProcessedEventRepository;
    const unitOfWork = {
      run: jest.fn(async <T>(work: () => Promise<T>) => work()),
    } satisfies IUnitOfWorkPort;
    const handler = { handle: jest.fn() } satisfies IConsumedEventHandler;
    const dispatcher = new ConsumedEventDispatcher(
      unitOfWork, processed, new Map([["company.created", handler]]),
    );
    await dispatcher.dispatch({
      eventId: crypto.randomUUID(), eventType: "company.created", payload: {},
    });
    expect(handler.handle).not.toHaveBeenCalled();
  });
});
