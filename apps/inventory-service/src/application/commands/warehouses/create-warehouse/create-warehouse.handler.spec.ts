import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { CreateWarehouseCommand } from "./create-warehouse.command";
import { CreateWarehouseHandler } from "./create-warehouse.handler";

describe("CreateWarehouseHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };

  it("publishes warehouse.created when a warehouse is created", async () => {
    const companyId = crypto.randomUUID();
    const warehouses = {
      findById: jest.fn(), findByCode: jest.fn(), list: jest.fn(),
      save: jest.fn().mockResolvedValue(true), update: jest.fn(), hasStock: jest.fn(),
    } satisfies IWarehouseRepository;
    const companies = {
      findById: jest.fn().mockResolvedValue({
        id: companyId, name: "Co", isActive: true, syncedAt: new Date(),
      }),
      upsert: jest.fn(), setActive: jest.fn(),
    } satisfies ICompanyReferenceRepository;
    const publisher = { publish: jest.fn() } satisfies IEventPublisherPort;
    const unitOfWork = {
      run: jest.fn(async <T>(work: () => Promise<T>) => work()),
    } satisfies IUnitOfWorkPort;
    const handler = new CreateWarehouseHandler(
      warehouses, companies, publisher, unitOfWork, actor);
    const result = await handler.execute(
      new CreateWarehouseCommand(companyId, "MAIN", "Ana Depo", null));
    expect(result.isSuccess).toBe(true);
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "warehouse.created" }),
    );
  });
});
