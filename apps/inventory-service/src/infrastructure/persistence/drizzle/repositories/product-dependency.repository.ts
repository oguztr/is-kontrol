import { and, eq, isNull, sql } from "drizzle-orm";
import type { IProductDependencyRepository } from "../../../../domain/repositories/product-dependency.repository.interface";
import type {
  DbExecutor,
  DrizzleTransactionHost,
} from "../drizzle.provider";
import { productCategories, unitsOfMeasure } from "../schema";

export class DrizzleProductDependencyRepository
  implements IProductDependencyRepository
{
  constructor(private readonly session: DrizzleTransactionHost) {}

  private get db(): DbExecutor {
    return this.session.db;
  }

  async lockCategoryGraphShared(companyId: string): Promise<void> {
    await this.db.execute(sql`select pg_advisory_xact_lock_shared(hashtextextended(${`category-graph|${companyId}`}, 0))`);
  }

  async unitBelongsToCompany(
    unitId: string,
    companyId: string,
  ): Promise<boolean> {
    const rows = await this.db
      .select({ id: unitsOfMeasure.id })
      .from(unitsOfMeasure)
      .where(
        and(
          eq(unitsOfMeasure.id, unitId),
          eq(unitsOfMeasure.companyId, companyId),
          eq(unitsOfMeasure.isActive, true),
          isNull(unitsOfMeasure.deletedAt),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async categoryBelongsToCompany(
    categoryId: string,
    companyId: string,
  ): Promise<boolean> {
    const rows = await this.db
      .select({ id: productCategories.id })
      .from(productCategories)
      .where(
        and(
          eq(productCategories.id, categoryId),
          eq(productCategories.companyId, companyId),
          isNull(productCategories.deletedAt),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }
}
