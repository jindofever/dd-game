import { DEFAULT_TUNING, DURATION_DEFINITIONS } from "@/lib/game/constants";
import type { DurationDefinition, DurationChances, TuningState } from "@/lib/game/types";

export function getDurationDefinition(hours: DurationDefinition["hours"]) {
  const duration = DURATION_DEFINITIONS.find((entry) => entry.hours === hours);
  if (!duration) {
    throw new Error(`Unknown duration ${hours}`);
  }
  return duration;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function mergeTuning(partial?: Partial<TuningState>): TuningState {
  return { ...DEFAULT_TUNING, ...partial };
}

export function getDurationChances(
  hours: DurationDefinition["hours"],
  tuning: TuningState,
): DurationChances {
  const q = hours / 12;
  return {
    q,
    eventChance: clamp(0.08 + 0.26 * q ** tuning.eventExponent, 0, 0.95),
    rareLootChance: clamp(0.005 + 0.085 * q ** tuning.lootExponent, 0, 0.85),
    traitChance: clamp(0.01 + 0.11 * q ** 1.35, 0, 0.8),
    setbackChance: clamp(0.02 + 0.16 * q ** tuning.setbackExponent, 0, 0.85),
    varianceBand: 0.08 + 0.12 * Math.sqrt(q),
  };
}
