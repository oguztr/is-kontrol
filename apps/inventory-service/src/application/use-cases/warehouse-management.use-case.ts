import { WarehouseEntity } from "../../domain/entities/warehouse.entity";
import { WarehouseErrors } from "../../domain/errors/warehouse.errors";
import type { WarehouseError } from "../../domain/errors/warehouse.errors";
import type { ICompanyReferenceRepository } from "../../domain/repositories/company-reference.repository.interface";
import type { IWarehouseRepository } from "../../domain/repositories/warehouse.repository.interface";
import type { IUnitOfWorkPort } from "../ports/unit-of-work.port";
import { Failure, Result, Success } from "../result";

export interface CreateWarehouseInput { companyId: string; code: string; name: string; address: string | null }

export class WarehouseManagementUseCase {
  constructor(
    private readonly warehouses: IWarehouseRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async create(input: CreateWarehouseInput): Promise<Result<{ id: string }, WarehouseError>> {
    const outcome = await this.unitOfWork.run<{ id: string } | WarehouseError>(async () => {
      const company = await this.companies.findById(input.companyId);
      if (!company) return WarehouseErrors.companyNotFound(input.companyId);
      if (!company.isActive) return WarehouseErrors.companyInactive(input.companyId);
      const warehouse = new WarehouseEntity({
        id: crypto.randomUUID(), companyId: input.companyId, code: input.code,
        name: input.name, address: input.address, isActive: true, createdAt: new Date(),
      });
      return await this.warehouses.save(warehouse)
        ? { id: warehouse.id }
        : WarehouseErrors.codeAlreadyExists(input.companyId, input.code);
    });
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }

  async update(id: string, name: string, address: string | null): Promise<Result<void, WarehouseError>> {
    return this.change(id, (warehouse) => warehouse.update(name, address));
  }

  async activate(id: string): Promise<Result<void, WarehouseError>> {
    return this.change(id, (warehouse) => warehouse.activate());
  }

  async deactivate(id: string): Promise<Result<void, WarehouseError>> {
    return this.change(id, (warehouse) => warehouse.deactivate());
  }

  async delete(id: string): Promise<Result<void, WarehouseError>> {
    const error = await this.unitOfWork.run<WarehouseError | undefined>(async () => {
      const warehouse = await this.warehouses.findById(id);
      if (!warehouse) return WarehouseErrors.notFound(id);
      if (await this.warehouses.hasStock(id)) return WarehouseErrors.hasStock(id);
      warehouse.delete(new Date());
      await this.warehouses.update(warehouse);
      return undefined;
    });
    return error ? new Failure(error) : new Success(undefined);
  }

  async list(companyId: string): Promise<Result<WarehouseEntity[], WarehouseError>> {
    const company = await this.companies.findById(companyId);
    if (!company) return new Failure(WarehouseErrors.companyNotFound(companyId));
    return new Success(await this.warehouses.list(companyId));
  }

  async get(id: string): Promise<Result<WarehouseEntity, WarehouseError>> {
    const warehouse = await this.warehouses.findById(id);
    return warehouse ? new Success(warehouse) : new Failure(WarehouseErrors.notFound(id));
  }

  private async change(id: string, change: (warehouse: WarehouseEntity) => void): Promise<Result<void, WarehouseError>> {
    const error = await this.unitOfWork.run<WarehouseError | undefined>(async () => {
      const warehouse = await this.warehouses.findById(id);
      if (!warehouse) return WarehouseErrors.notFound(id);
      change(warehouse);
      await this.warehouses.update(warehouse);
      return undefined;
    });
    return error ? new Failure(error) : new Success(undefined);
  }
}
