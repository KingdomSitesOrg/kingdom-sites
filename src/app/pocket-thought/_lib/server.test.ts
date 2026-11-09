import { describe, expect, it } from "vitest";
import { PRICE_USD, validAnswer } from "./config";

describe("Pocket Thought demand question", () => {
  it("accepts only yes, maybe or no", () => {
    expect(["yes", "maybe", "no"].every(validAnswer)).toBe(true);
    expect(validAnswer("YES")).toBe(false);
    expect(validAnswer(1)).toBe(false);
  });

  it("asks about the planned $129 price", () => {
    expect(PRICE_USD).toBe(129);
  });
});
