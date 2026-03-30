import type { DecisionHook, Hero, RunEvent, TraitId } from "@/lib/game/types";

const EVENT_POOL: RunEvent[] = [
  { id: "camp-blessing", category: "boon", title: "Camp Blessing", effect: "+12 gold from a grateful caravan" },
  { id: "snare-field", category: "hazard", title: "Snare Field", effect: "Lose 8 gold escaping hidden traps" },
  { id: "hedge-merchant", category: "merchant", title: "Hedge Merchant", effect: "Trade a find for immediate value" },
  { id: "ashen-omen", category: "omen", title: "Ashen Omen", effect: "An omen sharpens your next decisions" },
  { id: "relic-burrow", category: "relic-find", title: "Relic Burrow", effect: "Extra loot from a forgotten niche" },
  { id: "road-wound", category: "wound", title: "Road Wound", effect: "A bad twist leaves you injured" },
];

const TRAIT_POOL: TraitId[] = [
  "Stalwart",
  "Lucky",
  "Greedy",
  "Arcane-Touched",
  "Scout",
  "Relic Hunter",
];

export function pickEvent(rng: { int: (min: number, max: number) => number }) {
  return EVENT_POOL[rng.int(0, EVENT_POOL.length - 1)];
}

export function pickTrait(hero: Hero, rng: { int: (min: number, max: number) => number }) {
  const available = TRAIT_POOL.filter((trait) => !hero.traits.includes(trait));
  if (available.length === 0) {
    return undefined;
  }
  return available[rng.int(0, available.length - 1)];
}

export function buildEventDecision(event: RunEvent): DecisionHook | undefined {
  if (event.category === "merchant") {
    return {
      source: "event",
      title: "Merchant Offer",
      prompt: "The merchant offers quick coin or a costly lesson from their maps.",
      options: [
        {
          id: "merchant_gold",
          label: "Take the coin",
          description: "Pocket 18 extra gold now.",
          effect: { type: "gain_gold", gold: 18 },
        },
        {
          id: "merchant_xp",
          label: "Study the maps",
          description: "Gain 20 XP instead of cash.",
          effect: { type: "gain_xp", xp: 20 },
        },
      ],
    };
  }

  if (event.category === "wound") {
    return {
      source: "setback",
      title: "Triage Decision",
      prompt: "You can spend coin to heal cleanly or grit through the next run.",
      options: [
        {
          id: "clear_injury",
          label: "Pay for treatment",
          description: "Spend 12 gold to remove injured now.",
          effect: { type: "clear_injury", goldCost: 12 },
        },
        {
          id: "keep_scars",
          label: "Walk it off",
          description: "Keep the injury and save your gold.",
          effect: { type: "none" },
        },
      ],
    };
  }

  return undefined;
}
