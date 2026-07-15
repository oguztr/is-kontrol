import type { StockMovementEntity } from "../../../../domain/entities/stock-movement.entity";
import { StockBalanceErrors } from "../../../../domain/errors/stock-balance.errors";
import type { StockBalanceError } from "../../../../domain/errors/stock-balance.errors";
import type {
  IStockBalanceRepository,
  ProductValuationRow,
} from "../../../../domain/repositories/stock-balance.repository.interface";
import type { IStockMovementRepository } from "../../../../domain/repositories/stock-movement.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { Decimal } from "../../../../domain/value-objects/decimal.vo";
import { GetInventoryDashboardQuery } from "./get-inventory-dashboard.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export interface InventoryDashboard {
  companyId: string;
  totals: { productCount: number; totalQuantity: string; totalValue: string };
  alerts: {
    belowMinimum: number;
    aboveMaximum: number;
    outOfStock: number;
    negative: number;
  };
  topProductsByValue: ProductValuationRow[];
  recentMovements: StockMovementEntity[];
}

const DASHBOARD_TOP_PRODUCTS = 5;
const DASHBOARD_RECENT_MOVEMENTS = 10;

export class GetInventoryDashboardHandler {
  constructor(
    private readonly balances: IStockBalanceRepository,
    private readonly movements: IStockMovementRepository,
    private readonly companies: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: GetInventoryDashboardQuery,
  ): Promise<Result<InventoryDashboard, StockBalanceError>> {
    if (!this.actor.allowsCompany(query.companyId))
      return new Failure(StockBalanceErrors.companyNotFound(query.companyId));
    const company = await this.companies.findById(query.companyId);
    if (!company)
      return new Failure(StockBalanceErrors.companyNotFound(query.companyId));
    const [totals, belowMinimum, aboveMaximum, outOfStock, negative, valuation, recentMovements] =
      await Promise.all([
        this.balances.companySummary(query.companyId),
        this.balances.listBelowMinimum(query.companyId),
        this.balances.listAboveMaximum(query.companyId),
        this.balances.listOutOfStockProducts(query.companyId),
        this.balances.listNegative(query.companyId),
        this.balances.valuation(query.companyId),
        this.movements.list({
          companyId: query.companyId,
          limit: DASHBOARD_RECENT_MOVEMENTS,
        }),
      ]);
    const topProductsByValue = [...valuation]
      .sort((a, b) =>
        Decimal.from(b.totalValue).subtract(Decimal.from(a.totalValue))
          .isPositive
          ? 1
          : -1,
      )
      .slice(0, DASHBOARD_TOP_PRODUCTS);
    return new Success({
      companyId: query.companyId,
      totals,
      alerts: {
        belowMinimum: belowMinimum.length,
        aboveMaximum: aboveMaximum.length,
        outOfStock: outOfStock.length,
        negative: negative.length,
      },
      topProductsByValue,
      recentMovements,
    });
  }
}
