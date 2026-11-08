import { describe, expect, it } from "vitest";
import { groupDec, money, pnlTone, pct, price, roundDec, sign, signedMoney } from "../src/lib/fmt";

describe("decimal-safe formatting (no float authority)", () => {
  it("rounds half away from zero on the digits, never via a float", () => {
    expect(roundDec("0.125", 2)).toBe("0.13"); expect(roundDec("-0.125", 2)).toBe("-0.13"); expect(roundDec("2.5", 0)).toBe("3"); expect(roundDec("1.005", 2)).toBe("1.01"); expect(roundDec("9.999", 2)).toBe("10.00");
  });
  it("keeps precision a float cannot", () => { expect(roundDec("12345678901234567.89", 2)).toBe("12345678901234567.89"); expect(money("12345678901234567.89")).toBe("₹12,34,56,78,90,12,34,567.89"); });
  it("groups digits the Indian way", () => { expect(groupDec("1234567")).toBe("12,34,567"); expect(groupDec("-1234.5")).toBe("−1,234.5"); expect(groupDec("999")).toBe("999"); });
  it("shows a missing or invalid value as a dash, never zero", () => { expect(money(null)).toBe("—"); expect(money(undefined)).toBe("—"); expect(money("abc")).toBe("—"); expect(price(null)).toBe("—"); expect(pct(null)).toBe("—"); });
  it("signs money and tones P&L by sign", () => {
    expect(signedMoney("1500")).toBe("+₹1,500.00"); expect(signedMoney("-920.5")).toBe("−₹920.50"); expect(sign("-0.00")).toBe(0); expect(sign("0")).toBe(0);
    expect([pnlTone("5"), pnlTone("-5"), pnlTone("0"), pnlTone(null)]).toEqual(["ok", "bad", "mute", "mute"]);
  });
  it("never turns a negative that rounds to zero into -0", () => { expect(roundDec("-0.001", 2)).toBe("0.00"); expect(signedMoney("-0.001")).toBe("+₹0.00"); });
});
