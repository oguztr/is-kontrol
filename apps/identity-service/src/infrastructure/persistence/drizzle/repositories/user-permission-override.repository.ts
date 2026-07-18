import { eq } from 'drizzle-orm';
import type {
  IUserPermissionOverrideRepository,
  UserPermissionOverride,
} from '../../../../domain/repositories/user-permission-override.repository.interface'
import type { DbExecutor, DrizzleTransactionHost } from '../drizzle.provider'
import { userPermissionOverrides } from '../schema'

export class DrizzleUserPermissionOverrideRepository
  implements IUserPermissionOverrideRepository
{
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async listByUser(userId: string): Promise<UserPermissionOverride[]> {
    const rows = await this.db
      .select({
        permission: userPermissionOverrides.permission,
        effect: userPermissionOverrides.effect,
      })
      .from(userPermissionOverrides)
      .where(eq(userPermissionOverrides.userId, userId));
    return rows;
  }
}
