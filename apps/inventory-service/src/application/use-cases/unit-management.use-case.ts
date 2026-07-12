import { UnitGroupEntity } from "../../domain/entities/unit-group.entity";
import { UnitOfMeasureEntity } from "../../domain/entities/unit-of-measure.entity";
import { UnitErrors } from "../../domain/errors/unit.errors";
import type { UnitError } from "../../domain/errors/unit.errors";
import type { ICompanyReferenceRepository } from "../../domain/repositories/company-reference.repository.interface";
import type { IUnitRepository } from "../../domain/repositories/unit.repository.interface";
import { Failure, Result, Success } from "../result";
import type { IUnitOfWorkPort } from "../ports/unit-of-work.port";
import { Decimal } from "../../domain/value-objects/decimal.vo";

export interface CreateUnitGroupInput { companyId: string; name: string }
export interface CreateUnitInput {
  companyId: string; unitGroupId: string; code: string; name: string;
  isBaseUnit: boolean; factorToBase: string;
}

export class UnitManagementUseCase {
  constructor(
    private readonly units: IUnitRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async createGroup(input: CreateUnitGroupInput): Promise<Result<{ id: string }, UnitError>> {
    const outcome = await this.unitOfWork.run<{ id: string } | UnitError>(async () => {
      const companyError = await this.companyError(input.companyId);
      if (companyError) return companyError;
      await this.units.lockGroupName(input.companyId, input.name);
      const group = new UnitGroupEntity(crypto.randomUUID(), input.companyId, input.name, new Date());
      return await this.units.saveGroup(group)
        ? { id: group.id }
        : UnitErrors.groupNameExists(input.companyId, input.name);
    });
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }

  async updateGroup(id: string, name: string): Promise<Result<void, UnitError>> {
    const error = await this.unitOfWork.run<UnitError | undefined>(async () => {
      const group = await this.units.findGroupById(id);
      if (!group) return UnitErrors.groupNotFound(id);
      await this.units.lockGroupName(group.companyId, name);
      const duplicate = await this.units.findGroupByName(group.companyId, name);
      if (duplicate && duplicate.id !== id) return UnitErrors.groupNameExists(group.companyId, name);
      group.rename(name);
      await this.units.updateGroup(group);
      return undefined;
    });
    return error ? new Failure(error) : new Success(undefined);
  }

  async deleteGroup(id: string): Promise<Result<void, UnitError>> {
    const error = await this.unitOfWork.run<UnitError | undefined>(async () => {
      const group = await this.units.findGroupById(id);
      if (!group) return UnitErrors.groupNotFound(id);
      if (await this.units.groupHasUnits(id)) return UnitErrors.groupNotEmpty(id);
      group.delete(new Date());
      await this.units.updateGroup(group);
      return undefined;
    });
    return error ? new Failure(error) : new Success(undefined);
  }

  async createUnit(input: CreateUnitInput): Promise<Result<{ id: string }, UnitError>> {
    const outcome = await this.unitOfWork.run<{ id: string } | UnitError>(async () => {
      const companyError = await this.companyError(input.companyId);
      if (companyError) return companyError;
      const group = await this.units.findGroupById(input.unitGroupId);
      if (!group || group.companyId !== input.companyId) return UnitErrors.groupNotFound(input.unitGroupId);
      await this.units.lockGroup(group.id);
      if (!input.isBaseUnit && !(await this.units.groupHasBaseUnit(group.id))) {
        return UnitErrors.baseUnitRequired(group.id);
      }
      const unit = new UnitOfMeasureEntity(
        crypto.randomUUID(), input.companyId, group.id, input.code, input.name,
        false, Decimal.from(input.factorToBase).toFixed(6),
        true, new Date(),
      );
      if (!(await this.units.saveUnit(unit))) {
        return UnitErrors.unitCodeExists(input.companyId, input.code);
      }
      if (input.isBaseUnit) {
        await this.units.clearBaseUnit(group.id, unit.id);
        unit.makeBase();
        await this.units.updateUnit(unit);
      }
      return { id: unit.id };
    });
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }

  async updateUnit(id: string, name: string): Promise<Result<void, UnitError>> {
    return this.changeUnit(id, (unit) => unit.update(name));
  }

  async deactivateUnit(id: string): Promise<Result<void, UnitError>> {
    return this.changeUnit(id, (unit) => {
      if (unit.isBaseUnit) return UnitErrors.baseUnitCannotDeactivate(id);
      unit.deactivate();
      return undefined;
    });
  }

  async setBaseUnit(id: string): Promise<Result<void, UnitError>> {
    const error = await this.unitOfWork.run<UnitError | undefined>(async () => {
      const unit = await this.units.findUnitById(id);
      if (!unit) return UnitErrors.unitNotFound(id);
      await this.units.lockGroup(unit.unitGroupId);
      await this.units.clearBaseUnit(unit.unitGroupId, unit.id);
      unit.makeBase();
      await this.units.updateUnit(unit);
      return undefined;
    });
    return error ? new Failure(error) : new Success(undefined);
  }

  async setConversionFactor(id: string, factor: string): Promise<Result<void, UnitError>> {
    return this.changeUnit(id, (unit) => {
      const normalized = Decimal.from(factor).toFixed(6);
      if (unit.isBaseUnit && normalized !== "1.000000") {
        return UnitErrors.baseUnitFactorMustBeOne(id);
      }
      unit.setConversionFactor(normalized);
      return undefined;
    });
  }

  async listGroups(companyId: string): Promise<Result<UnitGroupEntity[], UnitError>> {
    const error = await this.companyError(companyId);
    return error ? new Failure(error) : new Success(await this.units.listGroups(companyId));
  }

  async listUnits(companyId: string, groupId?: string): Promise<Result<UnitOfMeasureEntity[], UnitError>> {
    const error = await this.companyError(companyId);
    if (error) return new Failure(error);
    if (groupId) {
      const group = await this.units.findGroupById(groupId);
      if (!group || group.companyId !== companyId) return new Failure(UnitErrors.groupNotFound(groupId));
    }
    return new Success(await this.units.listUnits(companyId, groupId));
  }

  async getUnit(id: string): Promise<Result<UnitOfMeasureEntity, UnitError>> {
    const unit = await this.units.findUnitById(id);
    return unit ? new Success(unit) : new Failure(UnitErrors.unitNotFound(id));
  }

  private async changeUnit(
    id: string,
    change: (unit: UnitOfMeasureEntity) => UnitError | undefined | void,
  ): Promise<Result<void, UnitError>> {
    const error = await this.unitOfWork.run<UnitError | undefined>(async () => {
      const unit = await this.units.findUnitById(id);
      if (!unit) return UnitErrors.unitNotFound(id);
      const changeError = change(unit);
      if (changeError) return changeError;
      await this.units.updateUnit(unit);
      return undefined;
    });
    return error ? new Failure(error) : new Success(undefined);
  }

  private async companyError(companyId: string): Promise<UnitError | undefined> {
    const company = await this.companies.findById(companyId);
    if (!company) return UnitErrors.companyNotFound(companyId);
    if (!company.isActive) return UnitErrors.companyInactive(companyId);
    return undefined;
  }
}
