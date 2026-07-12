import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";
import { UnitGroupEntity } from "../../../../domain/entities/unit-group.entity";
import { UnitOfMeasureEntity } from "../../../../domain/entities/unit-of-measure.entity";
import type { IUnitRepository } from "../../../../domain/repositories/unit.repository.interface";
import type { DbExecutor, DrizzleTransactionHost } from "../drizzle.provider";
import { unitGroups, unitsOfMeasure } from "../schema";

export class DrizzleUnitRepository implements IUnitRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor { return this.session.db; }

  async lockGroup(groupId: string): Promise<void> {
    await this.db.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`unit-group|${groupId}`}, 0))`);
  }

  async lockGroupName(companyId: string, name: string): Promise<void> {
    await this.db.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`unit-group-name|${companyId}|${name}`}, 0))`);
  }

  async findGroupById(id: string): Promise<UnitGroupEntity | null> {
    const rows = await this.db.select().from(unitGroups)
      .where(and(eq(unitGroups.id, id), isNull(unitGroups.deletedAt))).limit(1);
    return rows[0] ? this.toGroup(rows[0]) : null;
  }

  async findGroupByName(companyId: string, name: string): Promise<UnitGroupEntity | null> {
    const rows = await this.db.select().from(unitGroups).where(and(
      eq(unitGroups.companyId, companyId), eq(unitGroups.name, name), isNull(unitGroups.deletedAt),
    )).limit(1);
    return rows[0] ? this.toGroup(rows[0]) : null;
  }

  async listGroups(companyId: string): Promise<UnitGroupEntity[]> {
    const rows = await this.db.select().from(unitGroups).where(and(
      eq(unitGroups.companyId, companyId), isNull(unitGroups.deletedAt),
    )).orderBy(asc(unitGroups.name), asc(unitGroups.id));
    return rows.map((row) => this.toGroup(row));
  }

  async saveGroup(group: UnitGroupEntity): Promise<boolean> {
    const rows = await this.db.insert(unitGroups).values({
      id: group.id, companyId: group.companyId, name: group.name,
      createdAt: group.createdAt, deletedAt: group.deletedAt ?? undefined,
    }).onConflictDoNothing({ target: [unitGroups.companyId, unitGroups.name] })
      .returning({ id: unitGroups.id });
    return rows.length > 0;
  }

  async updateGroup(group: UnitGroupEntity): Promise<boolean> {
    const rows = await this.db.update(unitGroups).set({
      name: group.name, deletedAt: group.deletedAt,
    }).where(eq(unitGroups.id, group.id)).returning({ id: unitGroups.id });
    return rows.length > 0;
  }

  async groupHasUnits(groupId: string): Promise<boolean> {
    const rows = await this.db.select({ id: unitsOfMeasure.id }).from(unitsOfMeasure)
      .where(eq(unitsOfMeasure.unitGroupId, groupId)).limit(1);
    return rows.length > 0;
  }

  async findUnitById(id: string): Promise<UnitOfMeasureEntity | null> {
    const rows = await this.db.select().from(unitsOfMeasure)
      .where(and(eq(unitsOfMeasure.id, id), isNull(unitsOfMeasure.deletedAt))).limit(1);
    return rows[0] ? this.toUnit(rows[0]) : null;
  }

  async findUnitByCode(companyId: string, code: string): Promise<UnitOfMeasureEntity | null> {
    const rows = await this.db.select().from(unitsOfMeasure).where(and(
      eq(unitsOfMeasure.companyId, companyId), eq(unitsOfMeasure.code, code),
      isNull(unitsOfMeasure.deletedAt),
    )).limit(1);
    return rows[0] ? this.toUnit(rows[0]) : null;
  }

  async listUnits(companyId: string, groupId?: string): Promise<UnitOfMeasureEntity[]> {
    const where = groupId
      ? and(eq(unitsOfMeasure.companyId, companyId), eq(unitsOfMeasure.unitGroupId, groupId), isNull(unitsOfMeasure.deletedAt))
      : and(eq(unitsOfMeasure.companyId, companyId), isNull(unitsOfMeasure.deletedAt));
    const rows = await this.db.select().from(unitsOfMeasure).where(where)
      .orderBy(asc(unitsOfMeasure.code), asc(unitsOfMeasure.id));
    return rows.map((row) => this.toUnit(row));
  }

  async saveUnit(unit: UnitOfMeasureEntity): Promise<boolean> {
    const rows = await this.db.insert(unitsOfMeasure).values({
      id: unit.id, companyId: unit.companyId, unitGroupId: unit.unitGroupId,
      code: unit.code, name: unit.name, isBaseUnit: unit.isBaseUnit,
      factorToBase: unit.factorToBase, isActive: unit.isActive, createdAt: unit.createdAt,
    }).onConflictDoNothing({ target: [unitsOfMeasure.companyId, unitsOfMeasure.code] })
      .returning({ id: unitsOfMeasure.id });
    return rows.length > 0;
  }

  async updateUnit(unit: UnitOfMeasureEntity): Promise<void> {
    await this.db.update(unitsOfMeasure).set({
      name: unit.name, isBaseUnit: unit.isBaseUnit,
      factorToBase: unit.factorToBase, isActive: unit.isActive,
    }).where(eq(unitsOfMeasure.id, unit.id));
  }

  async groupHasBaseUnit(groupId: string): Promise<boolean> {
    const rows = await this.db.select({ id: unitsOfMeasure.id }).from(unitsOfMeasure)
      .where(and(eq(unitsOfMeasure.unitGroupId, groupId), eq(unitsOfMeasure.isBaseUnit, true), eq(unitsOfMeasure.isActive, true)))
      .limit(1);
    return rows.length > 0;
  }

  async clearBaseUnit(groupId: string, exceptUnitId: string): Promise<void> {
    await this.db.update(unitsOfMeasure).set({ isBaseUnit: false }).where(and(
      eq(unitsOfMeasure.unitGroupId, groupId),
      ne(unitsOfMeasure.id, exceptUnitId),
    ));
  }

  private toGroup(row: typeof unitGroups.$inferSelect): UnitGroupEntity {
    return new UnitGroupEntity(row.id, row.companyId, row.name, row.createdAt, row.deletedAt ?? null);
  }

  private toUnit(row: typeof unitsOfMeasure.$inferSelect): UnitOfMeasureEntity {
    return new UnitOfMeasureEntity(
      row.id, row.companyId, row.unitGroupId, row.code, row.name,
      row.isBaseUnit, row.factorToBase, row.isActive, row.createdAt,
    );
  }
}
