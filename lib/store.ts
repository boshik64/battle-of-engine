import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { HeroId } from "./heroes";
import { applyVote, EMPTY_COUNTS, type Counts } from "./vote-rules";

type Store = {
  counts: Counts;
  voters: Record<string, HeroId>;
};

const dataDir = path.join(process.cwd(), "data");
const storeFile = path.join(dataDir, "votes.json");

function lock<T>(fn: () => Promise<T>): Promise<T> {
  const g = globalThis as { __bmVoteLock?: Promise<unknown> };
  const prev = g.__bmVoteLock ?? Promise.resolve();
  const run = prev.then(fn, fn);
  g.__bmVoteLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(storeFile, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return {
      counts: {
        andrey: Number(parsed.counts?.andrey) || 0,
        dmitry: Number(parsed.counts?.dmitry) || 0,
      },
      voters: parsed.voters ?? {},
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { counts: { ...EMPTY_COUNTS }, voters: {} };
    }
    throw error;
  }
}

async function writeStore(store: Store) {
  await mkdir(dataDir, { recursive: true });
  const tmp = `${storeFile}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(store), "utf8");
  await rename(tmp, storeFile);
}

export async function readCounts(): Promise<Counts> {
  const store = await readStore();
  return store.counts;
}

export async function castVote(voterId: string, hero: HeroId) {
  return lock(async () => {
    const store = await readStore();
    const current = store.voters[voterId] ?? null;
    const next = applyVote(current, hero, store.counts);
    store.counts = next.counts;
    store.voters[voterId] = next.current;
    await writeStore(store);
    return { counts: next.counts, changed: next.changed, hero: next.current };
  });
}
