import { UnitGroupEntity } from "../../../../domain/entities/unit-group.entity";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { CreateUnitCommand } from "./create-unit.command";
import { CreateUnitHandler } from "./create-unit.handler";

describe("CreateUnitHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
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
    const handler = new CreateUnitHandler(units, companies, unitOfWork, actor);
    const result = await handler.execute(
      new CreateUnitCommand(companyId, group.id, "KG", "Kilogram", false, "1"),
    );
    expect(result.isFailure).toBe(true);
    expect(units.saveUnit).not.toHaveBeenCalled();
  });
});
