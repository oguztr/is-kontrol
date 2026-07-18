/* Identity servisinin imzaladığı access token'ın claim sözleşmesi.
 * Identity token'ı üretirken bu şekle yazar; diğer tüm servisler
 * JwtAuthGuard üzerinden bu şekli okur. İki taraf da bu dosyaya bağlıdır —
 * claim eklemek/değiştirmek burada yapılır. */
export interface AccessTokenPayload {
  /** Kullanıcı id'si (users.id). */
  sub: string;
  companyId: string;
  email: string;
  /** Rol kodu (OWNER, ADMIN, ...) — bilgi amaçlı; yetki kontrolü permissions üzerinden yapılır. */
  role: string;
  /** Efektif izin seti: rol izinleri + kullanıcı override'ları ("inventory:write" formatında). */
  permissions: string[];
}

/** JwtAuthGuard'ın doğrulama sonrası request'e koyduğu kullanıcı bilgisi. */
export interface AuthenticatedUser {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  permissions: readonly string[];
}

/** req.user'ın tipli hali; controller'lar Express tipine bağımlı olmadan kullanır. */
export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}
