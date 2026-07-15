import { ProductCategoryEntity } from "../../../../domain/entities/product-category.entity";
import type { IProductCategoryRepository } from "../../../../domain/repositories/product-category.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { UpdateProductCategoryCommand } from "./update-product-category.command";
import { UpdateProductCategoryHandler } from "./update-product-category.handler";

describe("UpdateProductCategoryHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
  const companyId = crypto.randomUUID();
  const parent = new ProductCategoryEntity(crypto.randomUUID(), companyId, null, "Parent", new Date());
  const child = new ProductCategoryEntity(crypto.randomUUID(), companyId, parent.id, "Child", new Date());
  const unitOfWork = {
    run: jest.fn(async <T>(work: () => Promise<T>) => work()),
  } satisfies IUnitOfWorkPort;

  it("rejects assigning a category below its own descendant", async () => {
    const categories = {
      lockCompanyGraph: jest.fn(),
      findById: jest.fn(async (id: string) => id === parent.id ? parent : id === child.id ? child : null),
      list: jest.fn(), save: jest.fn(), update: jest.fn(),
      detachProducts: jest.fn(), reparentChildren: jest.fn(),
    } satisfies IProductCategoryRepository;
    const handler = new UpdateProductCategoryHandler(categories, unitOfWork, actor);
    const result = await handler.execute(
      new UpdateProductCategoryCommand(parent.id, parent.name, child.id));
    expect(result.isFailure).toBe(true);
    expect(categories.update).not.toHaveBeenCalled();
  });
});
