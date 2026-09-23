import assert from "node:assert/strict";
import test from "node:test";
import { formatTrips } from "./plural.ts";
import { applyVote, EMPTY_COUNTS } from "./vote-rules.ts";

test("первый выбор добавляет одну поездку", () => {
  const next = applyVote(null, "andrey", EMPTY_COUNTS);
  assert.equal(next.changed, true);
  assert.deepEqual(next.counts, { andrey: 1, dmitry: 0 });
});

test("повтор того же героя не меняет счётчики", () => {
  const next = applyVote("dmitry", "dmitry", { andrey: 2, dmitry: 4 });
  assert.equal(next.changed, false);
  assert.deepEqual(next.counts, { andrey: 2, dmitry: 4 });
});

test("смена героя не уменьшает предыдущего", () => {
  const next = applyVote("andrey", "dmitry", { andrey: 3, dmitry: 1 });
  assert.equal(next.changed, true);
  assert.deepEqual(next.counts, { andrey: 3, dmitry: 2 });
});

test("формы поездок и пробел в тысячах", () => {
  assert.equal(formatTrips(1), "1 поездка");
  assert.equal(formatTrips(2), "2 поездки");
  assert.equal(formatTrips(5), "5 поездок");
  assert.equal(formatTrips(11), "11 поездок");
  assert.equal(formatTrips(21), "21 поездка");
  assert.equal(formatTrips(22), "22 поездки");
  assert.equal(formatTrips(1457), "1 457 поездок");
});
