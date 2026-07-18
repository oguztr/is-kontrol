export interface UserPermissionOverride {
  permission: string;
  effect: "ALLOW" | "DENY";
}

/* Kişiye özel izin istisnaları. Yönetim endpoint'i henüz yok; token
 * üretilirken okunup rol izinleriyle birleştirilir (DENY > ALLOW > rol). */
export interface IUserPermissionOverrideRepository {
  listByUser(userId: string): Promise<UserPermissionOverride[]>;
}
