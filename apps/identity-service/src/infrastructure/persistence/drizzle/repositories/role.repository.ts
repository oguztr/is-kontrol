import { and, asc, eq, isNull, or } from 'drizzle-orm';
import type { IRoleRepository } from '../../../../domain/repositories/role.repository.interface'
import { RoleEntity } from '../../../../domain/entities/role.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { roles } from '../schema'

export class DrizzleRoleRepository implements IRoleRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<RoleEntity | null> {
    const rows = await this.db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), isNull(roles.deletedAt)))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByCode(
    code: string,
    companyId: string | null,
  ): Promise<RoleEntity | null> {
    const rows = await this.db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.code, code),
          companyId === null
            ? isNull(roles.companyId)
            : eq(roles.companyId, companyId),
          isNull(roles.deletedAt),
        ),
      )
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async listForCompany(companyId: string): Promise<RoleEntity[]> {
    const rows = await this.db
      .select()
      .from(roles)
      .where(
        and(
          or(isNull(roles.companyId), eq(roles.companyId, companyId)),
          isNull(roles.deletedAt),
        ),
      )
      .orderBy(asc(roles.code), asc(roles.id));
    return rows.map((row) => this.toEntity(row));
  }

  async save(role: RoleEntity): Promise<void> {
    await this.db.insert(roles).values({
      id: role.id,
      companyId: role.companyId,
      code: role.code,
      name: role.name,
      isSystem: role.isSystem,
      permissions: role.permissions,
    });
  }

  async update(role: RoleEntity): Promise<void> {
    await this.db.update(roles).set({
      name: role.name,
      permissions: role.permissions,
    }).where(eq(roles.id, role.id));
  }

  private toEntity(row: typeof roles.$inferSelect): RoleEntity {
    return new RoleEntity({
      id: row.id,
      companyId: row.companyId ?? null,
      code: row.code,
      name: row.name,
      isSystem: row.isSystem,
      permissions: row.permissions ?? [],
    });
  }
}
