import type { OnApplicationBootstrap } from "@nestjs/common";
import { RoleEntity } from "../../../domain/entities/role.entity";
import type { IRoleRepository } from "../../../domain/repositories/role.repository.interface";
import type { IUnitOfWorkPort } from "../../../application/ports/unit-of-work.port";

/* Sabit sistem rolleri (companyId NULL) açılışta upsert edilir: yoksa
 * eklenir, varsa isim/izinleri koda göre tazelenir. Firmaya özel roller bu
 * seeder'ın kapsamı dışındadır. İzin formatı "kaynak:aksiyon"; "*" tam
 * joker, "kaynak:*" kaynak jokeri (libs/shared/auth PermissionsGuard). */
const SYSTEM_ROLES: ReadonlyArray<{
  code: string;
  name: string;
  permissions: string[];
}> = [
  { code: "OWNER", name: "Firma Sahibi", permissions: ["*"] },
  {
    code: "ADMIN",
    name: "Yönetici",
    permissions: ["identity:*", "inventory:*", "crm:*", "sales:*"],
  },
  {
    code: "MANAGER",
    name: "Müdür",
    permissions: ["identity:read", "inventory:*", "crm:*", "sales:*"],
  },
  {
    code: "EMPLOYEE",
    name: "Çalışan",
    permissions: [
      "inventory:read",
      "inventory:write",
      "crm:read",
      "crm:write",
      "sales:read",
      "sales:write",
    ],
  },
  {
    code: "VIEWER",
    name: "İzleyici",
    permissions: ["identity:read", "inventory:read", "crm:read", "sales:read"],
  },
];

export class SystemRolesSeeder implements OnApplicationBootstrap {
  constructor(
    private readonly roles: IRoleRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.unitOfWork.run(async () => {
      for (const definition of SYSTEM_ROLES) {
        const existing = await this.roles.findByCode(definition.code, null);
        if (!existing) {
          await this.roles.save(
            new RoleEntity({
              id: crypto.randomUUID(),
              companyId: null,
              code: definition.code,
              name: definition.name,
              isSystem: true,
              permissions: definition.permissions,
            }),
          );
          continue;
        }
        existing.name = definition.name;
        existing.permissions = definition.permissions;
        await this.roles.update(existing);
      }
    });
  }
}
