import { UnitOfMeasureEntity } from "../../../../domain/entities/unit-of-measure.entity";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { SetBaseUnitCommand } from "./set-base-unit.command";
import { SetBaseUnitHandler } from "./set-base-unit.handler";

describe("SetBaseUnitHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
  const companyId = crypto.randomUUID();
  const groupId = crypto.randomUUID();
  const repository = (): jest.Mocked<IUnitRepository> => ({
    lockGroup: jest.fn(), lockGroupName: jest.fn(),
    findGroupById: jest.fn(), findGroupByName: jest.fn(), listGroups: jest.fn(),
    saveGroup: jest.fn(), updateGroup: jest.fn(), groupHasUnits: jest.fn(),
    findUnitById: jest.fn(), findUnitByCode: jest.fn(), listUnits: jest.fn(),
    saveUnit: jest.fn(), updateUnit: jest.fn(), groupHasBaseUnit: jest.fn(),
    clearBaseUnit: jest.fn(),
  });
  const unitOfWork = {
    run: jest.fn(async <T>(work: () => Promise<T>) => work()),
  } satisfies IUnitOfWorkPort;

  it("serializes base-unit changes and normalizes its factor", async () => {
    const units = repository();
    const unit = new UnitOfMeasureEntity(
      crypto.randomUUID(), companyId, groupId, "KG", "Kilogram",
      false, "1000.000000", true, new Date(),
    );
    units.findUnitById.mockResolvedValue(unit);
    const handler = new SetBaseUnitHandler(units, unitOfWork, actor);
    const result = await handler.execute(new SetBaseUnitCommand(unit.id));
    expect(result.isSuccess).toBe(true);
    expect(units.lockGroup).toHaveBeenCalledWith(groupId);
    expect(units.clearBaseUnit).toHaveBeenCalledWith(groupId, unit.id);
    expect(unit.factorToBase).toBe("1.000000");
    expect(unit.isBaseUnit).toBe(true);
  });
});
