import { WarehouseEntity } from "../../domain/entities/warehouse.entity";
import type { ICompanyReferenceRepository } from "../../domain/repositories/company-reference.repository.interface";
import type { IWarehouseRepository } from "../../domain/repositories/warehouse.repository.interface";
import type { IUnitOfWorkPort } from "../ports/unit-of-work.port";
import { WarehouseManagementUseCase } from "./warehouse-management.use-case";

describe("WarehouseManagementUseCase", () => {
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
    const companies = {
      findById: jest.fn(), upsert: jest.fn(), setActive: jest.fn(),
    } satisfies ICompanyReferenceRepository;
    const unitOfWork = {
      run: jest.fn(async <T>(work: () => Promise<T>) => work()),
    } satisfies IUnitOfWorkPort;
    const useCase = new WarehouseManagementUseCase(warehouses, companies, unitOfWork);
    const result = await useCase.delete(warehouse.id);
    expect(result.isFailure).toBe(true);
    expect(warehouses.update).not.toHaveBeenCalled();
    expect(warehouse.deletedAt).toBeNull();
  });
});
