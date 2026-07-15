import { WarehouseEntity } from "../../../../domain/entities/warehouse.entity";
import type { IWarehouseRepository } from "../../../../domain/repositories/warehouse.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { DeleteWarehouseCommand } from "./delete-warehouse.command";
import { DeleteWarehouseHandler } from "./delete-warehouse.handler";

describe("DeleteWarehouseHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };

  it("prevents deleting a warehouse that contains stock", async () => {
    const warehouse = new WarehouseEntity({
      id: crypto.randomUUID(), companyId: crypto.randomUUID(), code: "MAIN",
      name: "Main", address: null, isActive: true, createdAt: new Date(),
    });
    const warehouses = {
      findById: jest.fn().mockResolvedValue(warehouse), findByCode: jest.fn(),
      list: jest.fn(), save: jest.fn(), update: jest.fn(),
      hasStock: jest.fn().mockResolvedValue(true),
    } satisfies IWarehouseRepository;
    const unitOfWork = {
      run: jest.fn(async <T>(work: () => Promise<T>) => work()),
    } satisfies IUnitOfWorkPort;
    const handler = new DeleteWarehouseHandler(warehouses, unitOfWork, actor);
    const result = await handler.execute(new DeleteWarehouseCommand(warehouse.id));
    expect(result.isFailure).toBe(true);
    expect(warehouses.update).not.toHaveBeenCalled();
    expect(warehouse.deletedAt).toBeNull();
  });
});
