import assert from "node:assert/strict";
import test from "node:test";
import { formatShoeAnalysis } from "../lib/shoe-analysis.js";

test("reports non-footwear without inventing shoe attributes", () => {
  const result = formatShoeAnalysis(
    JSON.stringify({
      isFootwear: false,
      brand: "Not applicable",
      model: "Not applicable",
      conditionGrade: "unable to assess",
      conditionDetails: "",
      notable: "",
    }),
  );

  assert.equal(result.isFootwear, false);
  assert.match(result.message, /doesn't appear to show footwear/);
  assert.equal("brand" in result, false);
  assert.equal("condition" in result, false);
});

test("formats identified shoe details as grammatical output", () => {
  const result = formatShoeAnalysis(
    JSON.stringify({
      isFootwear: true,
      brand: "nike",
      model: "air max 90",
      conditionGrade: "good",
      conditionDetails: "light creasing near the toe.",
      notable: "Visible mesh panels",
    }),
  );

  assert.equal(result.isFootwear, true);
  assert.equal(result.brand, "Nike");
  assert.equal(result.model, "Air max 90");
  assert.equal(result.condition, "The shoe appears to be in good condition, with light creasing near the toe.");
  assert.equal(result.notable, "Visible mesh panels.");
});

test("rejects invalid model output rather than inventing a result", () => {
  assert.throws(() => formatShoeAnalysis('{"isFootwear": false}'));
});
