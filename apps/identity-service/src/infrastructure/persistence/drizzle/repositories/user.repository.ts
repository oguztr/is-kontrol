import { and, asc, count, eq, isNull } from 'drizzle-orm';
import type { IUserRepository } from '../../../../domain/repositories/user.repository.interface'
import { UserEntity } from '../../../../domain/entities/user.entity'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { users } from '../schema'

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByIdForUpdate(id: string): Promise<UserEntity | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)
      .for('update');
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  // E-postalar yazımda küçük harfe çevrilir (DTO şemasında); arama da
  // normalize edilmiş değerle birebir eşleşir.
  async findByEmail(email: string): Promise<UserEntity | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async save(user: UserEntity): Promise<void> {
    await this.db.insert(users).values({
      id: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    });
  }

  async update(user: UserEntity): Promise<void> {
    await this.db.update(users).set({
      roleId: user.roleId,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      deletedAt: user.deletedAt,
    }).where(eq(users.id, user.id));
  }

  async listByCompany(companyId: string): Promise<UserEntity[]> {
    const rows = await this.db
      .select()
      .from(users)
      .where(and(eq(users.companyId, companyId), isNull(users.deletedAt)))
      .orderBy(asc(users.firstName), asc(users.lastName), asc(users.id));
    return rows.map((row) => this.toEntity(row));
  }

  async countActiveByCompany(companyId: string): Promise<number> {
    const rows = await this.db
      .select({ total: count() })
      .from(users)
      .where(
        and(
          eq(users.companyId, companyId),
          eq(users.status, 'ACTIVE'),
          isNull(users.deletedAt),
        ),
      );
    return rows[0]?.total ?? 0;
  }

  private toEntity(row: typeof users.$inferSelect): UserEntity {
    return new UserEntity({
      id: row.id,
      companyId: row.companyId,
      roleId: row.roleId,
      email: row.email,
      passwordHash: row.passwordHash,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone ?? null,
      avatarUrl: row.avatarUrl ?? null,
      status: row.status,
      emailVerifiedAt: row.emailVerifiedAt ?? null,
      lastLoginAt: row.lastLoginAt ?? null,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt ?? null,
    });
  }
}
