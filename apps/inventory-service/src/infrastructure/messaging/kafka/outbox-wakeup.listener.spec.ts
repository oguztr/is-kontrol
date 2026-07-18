import type { Sql } from "postgres";
import { OUTBOX_WAKEUP_CHANNEL } from "../../persistence/drizzle/repositories/outbox.repository";
import type { OutboxPublisherWorker } from "./outbox-publisher.worker";
import { OutboxWakeupListener } from "./outbox-wakeup.listener";

describe("OutboxWakeupListener", () => {
  function createFakes() {
    const unlisten = jest.fn().mockResolvedValue(undefined);
    const listen = jest.fn().mockResolvedValue({ unlisten });
    const worker = { wake: jest.fn() };
    const listener = new OutboxWakeupListener(
      { listen } as unknown as Sql,
      worker as unknown as OutboxPublisherWorker,
    );
    return { listener, listen, unlisten, worker };
  }

  it("wakes the worker on NOTIFY and on every (re)connect", async () => {
    const { listener, listen, worker } = createFakes();

    await listener.start();

    expect(listen).toHaveBeenCalledWith(
      OUTBOX_WAKEUP_CHANNEL,
      expect.any(Function),
      expect.any(Function),
    );
    const [, onNotify, onListen] = listen.mock.calls[0];
    onNotify("");
    onListen();
    expect(worker.wake).toHaveBeenCalledTimes(2);
  });

  it("unlistens once on stop and tolerates stop without start", async () => {
    const { listener, unlisten } = createFakes();

    await listener.stop();
    expect(unlisten).not.toHaveBeenCalled();

    await listener.start();
    await listener.stop();
    await listener.stop();
    expect(unlisten).toHaveBeenCalledTimes(1);
  });
});
