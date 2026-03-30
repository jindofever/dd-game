export type ClassId = "fighter" | "rogue" | "mage";
export type StatKey = "might" | "wit" | "grit" | "luck";
export type EquipmentSlot = "weapon" | "armor" | "trinket";
export type ItemRarity = "common" | "uncommon" | "rare" | "epic";
export type EncounterTag = "combat" | "hazard" | "mystic" | "opportunity";
export type EncounterOutcomeTier = "fail" | "mixed" | "success" | "crit";
export type EventCategory =
  | "boon"
  | "hazard"
  | "merchant"
  | "omen"
  | "relic-find"
  | "wound";
export type TraitId =
  | "Stalwart"
  | "Lucky"
  | "Greedy"
  | "Arcane-Touched"
  | "Scout"
  | "Relic Hunter";

export interface Stats {
  might: number;
  wit: number;
  grit: number;
  luck: number;
}

export interface Item {
  id: string;
  templateId: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  statBonus: Partial<Record<StatKey, number>>;
  sellValue: number;
  tags: string[];
}

export interface HeroStatus {
  injured: boolean;
  injuryLabel?: string;
}

export interface Hero {
  classId: ClassId;
  level: number;
  xp: number;
  gold: number;
  runs: number;
  stats: Stats;
  traits: TraitId[];
  equipped: Partial<Record<EquipmentSlot, Item>>;
  inventory: Item[];
  status: HeroStatus;
}

export interface ClassDefinition {
  id: ClassId;
  name: string;
  fantasy: string;
  startingStats: Stats;
  primaryStat: StatKey;
  secondaryStat: StatKey;
  passiveLabel: string;
  encounterBias: Record<EncounterTag, number>;
  startingGear: Item[];
}

export interface DurationDefinition {
  hours: 1 | 4 | 8 | 12 | 24;
  label: string;
  feel: string;
  promise: string;
  encounterRange: [number, number];
  xpRange: [number, number];
  goldRange: [number, number];
}

export interface RewardBand {
  xp: number;
  goldRange: [number, number];
}

export interface EncounterDefinition {
  id: string;
  tag: EncounterTag;
  title: string;
  difficultyBase: number;
  relevantStat: StatKey;
}

export interface EncounterResult extends EncounterDefinition {
  roll: number;
  score: number;
  difficulty: number;
  outcome: EncounterOutcomeTier;
  xp: number;
  gold: number;
  notes: string[];
}

export interface RunEvent {
  id: string;
  category: EventCategory;
  title: string;
  effect: string;
}

export interface Setback {
  label: string;
  goldLost: number;
  injuredApplied: boolean;
}

export interface LevelUp {
  newLevel: number;
  increased: StatKey[];
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  effect:
    | { type: "equip_item"; itemId: string }
    | { type: "sell_item"; itemId: string; gold: number }
    | { type: "gain_gold"; gold: number }
    | { type: "gain_xp"; xp: number }
    | { type: "clear_injury"; goldCost: number }
    | { type: "none" };
}

export interface DecisionHook {
  source: "loot" | "event" | "setback";
  title: string;
  prompt: string;
  options: DecisionOption[];
}

export interface RunTotals {
  xpGained: number;
  goldGained: number;
  netGold: number;
  encountersWon: number;
  encountersMixed: number;
  encountersLost: number;
  crits: number;
}

export interface DurationChances {
  q: number;
  eventChance: number;
  rareLootChance: number;
  traitChance: number;
  setbackChance: number;
  varianceBand: number;
}

export interface RunDebugData {
  seed: string;
  encounterCount: number;
  lootRoll: number;
  traitRoll: number;
  eventRoll: number;
  setbackRoll: number;
  durationChances: DurationChances;
  durationLabel: string;
  durationFeel: string;
}

export interface RunResult {
  seed: string;
  durationHours: DurationDefinition["hours"];
  encounters: EncounterResult[];
  totals: RunTotals;
  event?: RunEvent;
  loot: Item[];
  traitGain?: TraitId;
  setback?: Setback;
  decisionHook?: DecisionHook;
  levelUps: LevelUp[];
  heroBefore: Hero;
  heroAfter: Hero;
  debug: RunDebugData;
}

export interface NarrationResponse {
  summary: string;
  decisions: Array<Pick<DecisionOption, "id" | "label" | "description">>;
}

export interface SessionAnalytics {
  sessionStartedAt: number;
  runCount: number;
  runsByDuration: Record<string, number>;
  lastRunAt?: number;
  averageGapMs: number;
  narrationRequests: number;
  narrationFailures: number;
  decisionCount: number;
  decisionResolvedCount: number;
  repeatAfterSetbackCount: number;
}

export interface TuningState {
  eventExponent: number;
  lootExponent: number;
  setbackExponent: number;
  classEventBonus: number;
  classLootBonus: number;
  classSetbackMitigation: number;
}

export interface GameSettings {
  aiEnabled: boolean;
  debugOpen: boolean;
}

export interface GameState {
  hero: Hero;
  lastRun?: RunResult;
  pendingDecision?: DecisionHook;
  narration: NarrationResponse;
  tuning: TuningState;
  analytics: SessionAnalytics;
  settings: GameSettings;
}
