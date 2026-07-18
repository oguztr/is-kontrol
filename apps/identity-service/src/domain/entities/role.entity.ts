/* companyId null ise sistem rolüdür (tüm firmalar için ortak, seed'lenir);
 * dolu ise o firmaya özel özelleştirilmiş roldür. İzinler "kaynak:aksiyon"
 * string'leridir; token üretilirken JWT'ye claim olarak gömülür. */
export class RoleEntity {
  public readonly id: string;
  public readonly companyId: string | null;
  public readonly code: string;
  public name: string;
  public readonly isSystem: boolean;
  public permissions: string[];

  constructor(params: {
    id: string;
    companyId: string | null;
    code: string;
    name: string;
    isSystem: boolean;
    permissions: string[];
  }) {
    this.id = params.id;
    this.companyId = params.companyId;
    this.code = params.code;
    this.name = params.name;
    this.isSystem = params.isSystem;
    this.permissions = params.permissions;
  }

  /** Rol bu firmaya atanabilir mi: sistem rolü ya da firmanın kendi rolü. */
  assignableTo(companyId: string): boolean {
    return this.companyId === null || this.companyId === companyId;
  }
}
