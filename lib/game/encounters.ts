import { CLASS_DEFINITIONS } from "@/lib/game/classes";
import { ENCOUNTER_POOL, REWARD_BANDS } from "@/lib/game/constants";
import type {
  EncounterDefinition,
  EncounterOutcomeTier,
  EncounterResult,
  Hero,
  StatKey,
} from "@/lib/game/types";

function weightedPick<T>(
  items: T[],
  weightGetter: (item: T) => number,
  roll: number,
) {
  const total = items.reduce((sum, item) => sum + weightGetter(item), 0);
  let cursor = roll * total;
  for (const item of items) {
    cursor -= weightGetter(item);
    if (cursor <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
}

function getTraitEncounterBonus(hero: Hero, encounter: EncounterDefinition) {
  let bonus = 0;
  if (hero.traits.includes("Stalwart") && encounter.tag === "hazard") {
    bonus += 2;
  }
  if (hero.traits.includes("Arcane-Touched") && encounter.tag === "mystic") {
    bonus += 2;
  }
  if (hero.traits.includes("Scout") && (encounter.tag === "hazard" || encounter.tag === "opportunity")) {
    bonus += 2;
  }
  if (hero.traits.includes("Lucky") && encounter.tag === "opportunity") {
    bonus += 1;
  }
  return bonus;
}

export function getTotalStat(hero: Hero, stat: StatKey) {
  const gearBonus = Object.values(hero.equipped).reduce(
    (sum, item) => sum + (item?.statBonus[stat] ?? 0),
    0,
  );
  const traitBonus =
    stat === "grit" && hero.traits.includes("Stalwart")
      ? 1
      : stat === "luck" && hero.traits.includes("Lucky")
        ? 1
        : stat === "wit" && hero.traits.includes("Arcane-Touched")
          ? 1
          : 0;

  const injuryPenalty = hero.status.injured && stat === "grit" ? 1 : 0;

  return hero.stats[stat] + gearBonus + traitBonus - injuryPenalty;
}

export function buildEncounters(
  count: number,
  hero: Hero,
  rng: { next: () => number },
): EncounterDefinition[] {
  const classDef = CLASS_DEFINITIONS[hero.classId];
  return Array.from({ length: count }, (_, index) => {
    const pick = weightedPick(
      ENCOUNTER_POOL,
      (encounter) => classDef.encounterBias[encounter.tag],
      (rng.next() + index * 0.01) % 1,
    );
    return {
      ...pick,
    };
  });
}

function resolveOutcome(score: number, difficulty: number): EncounterOutcomeTier {
  const delta = score - difficulty;
  if (delta >= 7) return "crit";
  if (delta >= 2) return "success";
  if (delta >= -2) return "mixed";
  return "fail";
}

export function resolveEncounters(
  encounters: EncounterDefinition[],
  hero: Hero,
  hours: number,
  varianceBand: number,
  rng: { int: (min: number, max: number) => number },
): EncounterResult[] {
  return encounters.map((encounter) => {
    const baseStat = getTotalStat(hero, encounter.relevantStat);
    const traitBonus = getTraitEncounterBonus(hero, encounter);
    const roll = rng.int(1, 20);
    const durationVariance = Math.round(hours * varianceBand * 0.4);
    const difficulty = encounter.difficultyBase + hero.level + rng.int(-1 - durationVariance, 1 + durationVariance);
    const score = baseStat + hero.level + traitBonus + roll;
    const outcome = resolveOutcome(score, difficulty);
    const reward = REWARD_BANDS[outcome];
    const gold = rng.int(reward.goldRange[0], reward.goldRange[1]);

    return {
      ...encounter,
      roll,
      score,
      difficulty,
      outcome,
      xp: reward.xp,
      gold,
      notes: [
        `${encounter.relevantStat}=${baseStat}`,
        `trait=${traitBonus}`,
        `roll=${roll}`,
        `difficulty=${difficulty}`,
      ],
    };
  });
}
