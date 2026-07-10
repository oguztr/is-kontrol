export class Money {
  public readonly amount: string;
  public readonly currencyCode: string;

  constructor(amount: string, currencyCode: string) {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) {
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
    const result = (parseFloat(this.amount) + parseFloat(other.amount)).toFixed(4);
    return new Money(result, this.currencyCode);
  }

  multiply(factor: number): Money {
    const result = (parseFloat(this.amount) * factor).toFixed(4);
    return new Money(result, this.currencyCode);
  }

  convertTo(targetCurrencyCode: string, exchangeRate: string): Money {
    const result = (parseFloat(this.amount) * parseFloat(exchangeRate)).toFixed(4);
    return new Money(result, targetCurrencyCode);
  }
}
