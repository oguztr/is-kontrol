import { ProductCategoryEntity } from "../../../../domain/entities/product-category.entity";
import type { IProductCategoryRepository } from "../../../../domain/repositories/product-category.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import { DeleteProductCategoryCommand } from "./delete-product-category.command";
import { DeleteProductCategoryHandler } from "./delete-product-category.handler";

describe("DeleteProductCategoryHandler", () => {
  const actor = { allowsCompany: () => true, userId: () => null };
  const companyId = crypto.randomUUID();
  const parent = new ProductCategoryEntity(crypto.randomUUID(), companyId, null, "Parent", new Date());
  const child = new ProductCategoryEntity(crypto.randomUUID(), companyId, parent.id, "Child", new Date());
  const unitOfWork = {
    run: jest.fn(async <T>(work: () => Promise<T>) => work()),
  } satisfies IUnitOfWorkPort;

  it("detaches products and reparents children when deleting", async () => {
    const categories = {
      lockCompanyGraph: jest.fn(), findById: jest.fn().mockResolvedValue(child),
      list: jest.fn(), save: jest.fn(), update: jest.fn(),
      detachProducts: jest.fn(), reparentChildren: jest.fn(),
    } satisfies IProductCategoryRepository;
    const handler = new DeleteProductCategoryHandler(categories, unitOfWork, actor);
    const result = await handler.execute(new DeleteProductCategoryCommand(child.id));
    expect(result.isSuccess).toBe(true);
    expect(categories.detachProducts).toHaveBeenCalledWith(child.id);
    expect(categories.reparentChildren).toHaveBeenCalledWith(child.id, parent.id);
    expect(child.deletedAt).toBeInstanceOf(Date);
  });
});
