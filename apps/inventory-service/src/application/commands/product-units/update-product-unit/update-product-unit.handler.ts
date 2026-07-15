import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { ProductUnitErrors } from "../../../../domain/errors/product-unit.errors";
import type { ProductUnitError } from "../../../../domain/errors/product-unit.errors";
import type { IProductRepository } from "../../../../domain/repositories/product.repository.interface";
import type { IProductUnitRepository } from "../../../../domain/repositories/product-unit.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { UpdateProductUnitCommand } from "./update-product-unit.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

const BASE_FACTOR = "1.000000";

export class UpdateProductUnitHandler {
  constructor(
    private readonly products: IProductRepository,
    private readonly productUnits: IProductUnitRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: UpdateProductUnitCommand,
  ): Promise<Result<void, ProductUnitError>> {
    const error = await this.unitOfWork.run<ProductUnitError | undefined>(
      async () => {
        const productUnit = await this.productUnits.findById(command.id);
        if (!productUnit) return ProductUnitErrors.notFound(command.id);
        const product = await this.products.findById(productUnit.productId);
        if (!product)
          return ProductUnitErrors.productNotFound(productUnit.productId);
        if (!this.actor.allowsCompany(product.companyId))
          return ProductUnitErrors.notFound(command.id);
        if (command.conversionFactor !== undefined) {
          const factor = Decimal.from(command.conversionFactor).toFixed(6);
          if (
            productUnit.unitId === product.baseUnitId &&
            factor !== BASE_FACTOR
          ) {
            return ProductUnitErrors.baseUnitFactorMustBeOne(
              productUnit.unitId,
            );
          }
          productUnit.setConversionFactor(factor);
        }
        if (command.isPurchaseUnit !== undefined)
          productUnit.setPurchaseUnit(command.isPurchaseUnit);
        if (command.isSalesUnit !== undefined)
          productUnit.setSalesUnit(command.isSalesUnit);
        if (command.barcode !== undefined)
          productUnit.setBarcode(command.barcode);
        await this.productUnits.update(productUnit);
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
