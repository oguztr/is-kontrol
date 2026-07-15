import { OptimisticLockError } from "../../../domain/errors/optimistic-lock.error";
import type { DrizzleTransactionHost } from "./drizzle.provider";
import { DrizzleUnitOfWork } from "./unit-of-work";

describe("DrizzleUnitOfWork", () => {
  const host = (inTransaction = false) => {
    const runInTransaction = jest.fn(
      async <T>(work: () => Promise<T>) => work(),
    );
    return {
      session: {
        inTransaction,
        runInTransaction,
      } as unknown as DrizzleTransactionHost,
      runInTransaction,
    };
  };

  it("retries the whole transaction on an optimistic lock conflict", async () => {
    const { session, runInTransaction } = host();
    const work = jest
      .fn()
      .mockRejectedValueOnce(new OptimisticLockError("w", "p"))
      .mockResolvedValueOnce("ok");
    const result = await new DrizzleUnitOfWork(session).run(work);
    expect(result).toBe("ok");
    expect(runInTransaction).toHaveBeenCalledTimes(2);
  });

  it("retries on a Postgres serialization failure and gives up after the limit", async () => {
    const { session } = host();
    const serializationFailure = Object.assign(new Error("could not serialize"), {
      code: "40001",
    });
    const work = jest.fn().mockRejectedValue(serializationFailure);
    await expect(new DrizzleUnitOfWork(session).run(work)).rejects.toBe(
      serializationFailure,
    );
    expect(work).toHaveBeenCalledTimes(3);
  });

  it("does not retry business errors", async () => {
    const { session } = host();
    const businessError = new Error("domain failure");
    const work = jest.fn().mockRejectedValue(businessError);
    await expect(new DrizzleUnitOfWork(session).run(work)).rejects.toBe(
      businessError,
    );
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("does not retry when already inside a transaction", async () => {
    const { session } = host(true);
    const work = jest
      .fn()
      .mockRejectedValue(new OptimisticLockError("w", "p"));
    await expect(new DrizzleUnitOfWork(session).run(work)).rejects.toBeInstanceOf(
      OptimisticLockError,
    );
    expect(work).toHaveBeenCalledTimes(1);
  });
});
