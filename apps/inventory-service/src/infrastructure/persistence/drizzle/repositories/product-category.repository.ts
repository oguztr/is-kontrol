import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { ProductCategoryEntity } from "../../../../domain/entities/product-category.entity";
import type { IProductCategoryRepository } from "../../../../domain/repositories/product-category.repository.interface";
import type { DbExecutor, DrizzleTransactionHost } from "../drizzle.provider";
import { productCategories, products } from "../schema";

export class DrizzleProductCategoryRepository implements IProductCategoryRepository {
  constructor(private readonly session: DrizzleTransactionHost) {}
  private get db(): DbExecutor { return this.session.db; }

  async lockCompanyGraph(companyId: string): Promise<void> {
    await this.db.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`category-graph|${companyId}`}, 0))`);
  }

  async findById(id: string): Promise<ProductCategoryEntity | null> {
    const rows = await this.db.select().from(productCategories).where(and(
      eq(productCategories.id, id), isNull(productCategories.deletedAt),
    )).limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async list(companyId: string): Promise<ProductCategoryEntity[]> {
    const rows = await this.db.select().from(productCategories).where(and(
      eq(productCategories.companyId, companyId), isNull(productCategories.deletedAt),
    )).orderBy(asc(productCategories.name), asc(productCategories.id));
    return rows.map((row) => this.toEntity(row));
  }

  async save(category: ProductCategoryEntity): Promise<void> {
    await this.db.insert(productCategories).values({
      id: category.id, companyId: category.companyId, parentId: category.parentId,
      name: category.name, createdAt: category.createdAt,
    });
  }

  async update(category: ProductCategoryEntity): Promise<void> {
    await this.db.update(productCategories).set({
      name: category.name, parentId: category.parentId, deletedAt: category.deletedAt,
    }).where(eq(productCategories.id, category.id));
  }

  async detachProducts(categoryId: string): Promise<void> {
    await this.db.update(products).set({ categoryId: null }).where(eq(products.categoryId, categoryId));
  }

  async reparentChildren(categoryId: string, parentId: string | null): Promise<void> {
    await this.db.update(productCategories).set({ parentId }).where(and(
      eq(productCategories.parentId, categoryId), isNull(productCategories.deletedAt),
    ));
  }

  private toEntity(row: typeof productCategories.$inferSelect): ProductCategoryEntity {
    return new ProductCategoryEntity(
      row.id, row.companyId, row.parentId ?? null, row.name,
      row.createdAt, row.deletedAt ?? null,
    );
  }
}
