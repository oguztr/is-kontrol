import { UnitGroupEntity } from "../../domain/entities/unit-group.entity";
import { UnitOfMeasureEntity } from "../../domain/entities/unit-of-measure.entity";
import type { ICompanyReferenceRepository } from "../../domain/repositories/company-reference.repository.interface";
import type { IUnitRepository } from "../../domain/repositories/unit.repository.interface";
import type { IUnitOfWorkPort } from "../ports/unit-of-work.port";
import { UnitManagementUseCase } from "./unit-management.use-case";

describe("UnitManagementUseCase", () => {
  const companyId = crypto.randomUUID();
  const group = new UnitGroupEntity(crypto.randomUUID(), companyId, "Weight", new Date());
  const repository = (): jest.Mocked<IUnitRepository> => ({
    lockGroup: jest.fn(), lockGroupName: jest.fn(),
    findGroupById: jest.fn(), findGroupByName: jest.fn(), listGroups: jest.fn(),
    saveGroup: jest.fn(), updateGroup: jest.fn(), groupHasUnits: jest.fn(),
    findUnitById: jest.fn(), findUnitByCode: jest.fn(), listUnits: jest.fn(),
    saveUnit: jest.fn(), updateUnit: jest.fn(), groupHasBaseUnit: jest.fn(),
    clearBaseUnit: jest.fn(),
  });
  const companies = {
    findById: jest.fn().mockResolvedValue({
      id: companyId, name: "Company", baseCurrencyCode: "TRY",
      isActive: true, syncedAt: new Date(),
    }),
    upsert: jest.fn(), setActive: jest.fn(),
  } satisfies ICompanyReferenceRepository;
  const unitOfWork = {
    run: jest.fn(async <T>(work: () => Promise<T>) => work()),
  } satisfies IUnitOfWorkPort;

  it("requires the first unit in a group to be the base unit", async () => {
    const units = repository();
    units.findGroupById.mockResolvedValue(group);
    units.groupHasBaseUnit.mockResolvedValue(false);
    const useCase = new UnitManagementUseCase(units, companies, unitOfWork);
    const result = await useCase.createUnit({
      companyId, unitGroupId: group.id, code: "KG", name: "Kilogram",
      isBaseUnit: false, factorToBase: "1",
    });
    expect(result.isFailure).toBe(true);
    expect(units.saveUnit).not.toHaveBeenCalled();
  });

  it("serializes base-unit changes and normalizes its factor", async () => {
    const units = repository();
    const unit = new UnitOfMeasureEntity(
      crypto.randomUUID(), companyId, group.id, "KG", "Kilogram",
      false, "1000.000000", true, new Date(),
    );
    units.findUnitById.mockResolvedValue(unit);
    const useCase = new UnitManagementUseCase(units, companies, unitOfWork);
    const result = await useCase.setBaseUnit(unit.id);
    expect(result.isSuccess).toBe(true);
    expect(units.lockGroup).toHaveBeenCalledWith(group.id);
    expect(units.clearBaseUnit).toHaveBeenCalledWith(group.id, unit.id);
    expect(unit.factorToBase).toBe("1.000000");
    expect(unit.isBaseUnit).toBe(true);
  });
});
