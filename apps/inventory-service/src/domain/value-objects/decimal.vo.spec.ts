import { Decimal } from "./decimal.vo";

describe("Decimal", () => {
  it("calculates without IEEE-754 precision loss", () => {
    expect(
      Decimal.from("0.1").add(Decimal.from("0.2")).toFixed(4),
    ).toBe("0.3000");
  });

  it("detects numeric precision overflow after rounding", () => {
    expect(Decimal.from("99999999999999.9999").fits(18, 4)).toBe(true);
    expect(Decimal.from("100000000000000.0000").fits(18, 4)).toBe(false);
  });
});
