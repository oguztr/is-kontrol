import type { UserEntity } from "../../../domain/entities/user.entity";

/* user.* event'lerinin ortak anlık görüntüsü. Şifre hash'i gibi hassas
 * alanlar bilinçli olarak dışarıda tutulur. */
export function userSnapshotPayload(user: UserEntity): Record<string, unknown> {
  return {
    id: user.id,
    companyId: user.companyId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roleId: user.roleId,
    isActive: user.isActive,
    occurredAt: new Date().toISOString(),
  };
}
