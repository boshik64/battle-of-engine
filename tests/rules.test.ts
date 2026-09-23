import assert from "node:assert/strict";
import test from "node:test";
import { formatTrips } from "../lib/plural.ts";
import { applyVote, EMPTY_COUNTS } from "../lib/vote-rules.ts";

test("повтор того же героя не увеличивает счётчик", () => {
  const first = applyVote(null, "andrey", EMPTY_COUNTS);
  assert.equal(first.changed, true);
  assert.deepEqual(first.counts, { andrey: 1, dmitry: 0 });
  const again = applyVote(first.current, "andrey", first.counts);
  assert.equal(again.changed, false);
  assert.deepEqual(again.counts, { andrey: 1, dmitry: 0 });
});

test("смена героя добавляет только новому", () => {
  const first = applyVote(null, "andrey", EMPTY_COUNTS);
  const swapped = applyVote("andrey", "dmitry", first.counts);
  assert.deepEqual(swapped.counts, { andrey: 1, dmitry: 1 });
  const back = applyVote("dmitry", "andrey", swapped.counts);
  assert.deepEqual(back.counts, { andrey: 2, dmitry: 1 });
});

test("формы поездок и пробел в тысячах", () => {
  assert.equal(formatTrips(0), "0 поездок");
  assert.equal(formatTrips(1), "1 поездка");
  assert.equal(formatTrips(2), "2 поездки");
  assert.equal(formatTrips(5), "5 поездок");
  assert.equal(formatTrips(11), "11 поездок");
  assert.equal(formatTrips(21), "21 поездка");
  assert.equal(formatTrips(22), "22 поездки");
  assert.equal(formatTrips(1457), "1 457 поездок");
});
