import type {
  DurationDefinition,
  EncounterDefinition,
  RewardBand,
  TraitId,
  TuningState,
} from "@/lib/game/types";

export const SAVE_KEY = "quest-unit-save-v1";
export const TUNING_KEY = "quest-unit-tuning-v1";

export const DURATION_DEFINITIONS: DurationDefinition[] = [
  {
    hours: 1,
    label: "1h",
    feel: "safe",
    promise: "Quick shakeout and injury recovery",
    encounterRange: [1, 1],
    xpRange: [8, 14],
    goldRange: [5, 8],
  },
  {
    hours: 4,
    label: "4h",
    feel: "steady",
    promise: "Reliable progress without much drama",
    encounterRange: [2, 3],
    xpRange: [32, 48],
    goldRange: [20, 32],
  },
  {
    hours: 8,
    label: "8h",
    feel: "spicy",
    promise: "Moderate variance with better stories",
    encounterRange: [4, 5],
    xpRange: [64, 96],
    goldRange: [40, 64],
  },
  {
    hours: 12,
    label: "12h",
    feel: "core",
    promise: "Full mini-adventure with the best texture",
    encounterRange: [5, 7],
    xpRange: [96, 144],
    goldRange: [60, 96],
  },
  {
    hours: 24,
    label: "24h",
    feel: "chaotic",
    promise: "Big swings, rare finds, and nasty setbacks",
    encounterRange: [10, 14],
    xpRange: [192, 288],
    goldRange: [120, 192],
  },
];

export const REWARD_BANDS: Record<string, RewardBand> = {
  fail: { xp: 6, goldRange: [0, 2] },
  mixed: { xp: 12, goldRange: [4, 6] },
  success: { xp: 18, goldRange: [8, 12] },
  crit: { xp: 24, goldRange: [12, 18] },
};

export const ENCOUNTER_POOL: EncounterDefinition[] = [
  {
    id: "bandit-ambush",
    tag: "combat",
    title: "Bandit Ambush",
    difficultyBase: 11,
    relevantStat: "might",
  },
  {
    id: "wolf-pack",
    tag: "combat",
    title: "Wolf Pack",
    difficultyBase: 10,
    relevantStat: "might",
  },
  {
    id: "broken-bridge",
    tag: "hazard",
    title: "Broken Bridge",
    difficultyBase: 10,
    relevantStat: "grit",
  },
  {
    id: "poison-mire",
    tag: "hazard",
    title: "Poison Mire",
    difficultyBase: 11,
    relevantStat: "grit",
  },
  {
    id: "rune-storm",
    tag: "mystic",
    title: "Rune Storm",
    difficultyBase: 12,
    relevantStat: "wit",
  },
  {
    id: "moon-shrine",
    tag: "mystic",
    title: "Moon Shrine",
    difficultyBase: 10,
    relevantStat: "wit",
  },
  {
    id: "buried-cache",
    tag: "opportunity",
    title: "Buried Cache",
    difficultyBase: 9,
    relevantStat: "luck",
  },
  {
    id: "wandering-scout",
    tag: "opportunity",
    title: "Wandering Scout",
    difficultyBase: 10,
    relevantStat: "luck",
  },
];

export const TRAIT_DESCRIPTIONS: Record<TraitId, string> = {
  Stalwart: "+1 grit and steadier recovery after setbacks",
  Lucky: "+1 luck and slightly better crit odds",
  Greedy: "+10% gold from successful runs",
  "Arcane-Touched": "+1 wit and stronger mystic encounters",
  Scout: "+1 luck on opportunity and hazard encounters",
  "Relic Hunter": "Higher chance to turn good runs into better loot",
};

export const DEFAULT_TUNING: TuningState = {
  eventExponent: 1.15,
  lootExponent: 1.6,
  setbackExponent: 1.45,
  classEventBonus: 0.15,
  classLootBonus: 0.15,
  classSetbackMitigation: 0.2,
};
