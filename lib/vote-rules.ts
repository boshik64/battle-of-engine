import type { HeroId } from "./heroes";

export type Counts = Record<HeroId, number>;

export const EMPTY_COUNTS: Counts = { andrey: 0, dmitry: 0 };

/**
 * ТЗ §3: предыдущий счётчик не уменьшается.
 * Тот же герой — без +1. Другой герой — только новому +1.
 */
export function applyVote(
  current: HeroId | null,
  next: HeroId,
  counts: Counts,
): { current: HeroId; counts: Counts; changed: boolean } {
  if (current === next) {
    return { current: next, counts: { ...counts }, changed: false };
  }
  return {
    current: next,
    changed: true,
    counts: { ...counts, [next]: counts[next] + 1 },
  };
}
