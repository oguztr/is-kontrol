import { Decimal } from "./decimal.vo";

export class Money {
  public readonly amount: string;
  public readonly currencyCode: string;

  constructor(amount: string, currencyCode: string) {
    const parsed = Decimal.from(amount);
    if (parsed.isNegative) {
      throw new Error(`Invalid money amount: ${amount}`);
    }
    this.amount = parsed.toFixed(4);
    this.currencyCode = currencyCode.toUpperCase();
  }

  add(other: Money): Money {
    if (this.currencyCode !== other.currencyCode) {
      throw new Error(
        `Cannot add money with different currencies: ${this.currencyCode} vs ${other.currencyCode}`,
      );
    }
    const result = Decimal.from(this.amount).add(Decimal.from(other.amount));
    return new Money(result.toFixed(4), this.currencyCode);
  }

  multiply(factor: string): Money {
    const result = Decimal.from(this.amount).multiply(Decimal.from(factor));
    return new Money(result.toFixed(4), this.currencyCode);
  }

  convertTo(targetCurrencyCode: string, exchangeRate: string): Money {
    const result = Decimal.from(this.amount).multiply(Decimal.from(exchangeRate));
    return new Money(result.toFixed(4), targetCurrencyCode);
  }
}
