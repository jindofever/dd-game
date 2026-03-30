export function hashString(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeed(input: string): string {
  return `seed-${hashString(input).toString(16)}`;
}

export function makeRng(seed: string) {
  let state = hashString(seed);
  return {
    next() {
      state += 0x6d2b79f5;
      let result = state;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    },
    int(min: number, max: number) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick<T>(items: T[]): T {
      return items[this.int(0, items.length - 1)];
    },
    bool(probability: number) {
      return this.next() < probability;
    },
  };
}
