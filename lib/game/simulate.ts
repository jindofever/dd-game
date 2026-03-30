import { CLASS_DEFINITIONS } from "@/lib/game/classes";
import { buildEncounters, resolveEncounters } from "@/lib/game/encounters";
import { buildEventDecision, pickEvent, pickTrait } from "@/lib/game/events";
import { compareItemUpgrade, equipItem, getItemTemplate, getItemsByRarity, sellItem } from "@/lib/game/loot";
import { applyLevelUps } from "@/lib/game/progression";
import { createSeed, makeRng } from "@/lib/game/seed";
import { getDurationChances, getDurationDefinition } from "@/lib/game/tuning";
import type {
  DecisionHook,
  DurationDefinition,
  Hero,
  Item,
  ItemRarity,
  RunEvent,
  RunResult,
  TuningState,
} from "@/lib/game/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getHeroSignature(hero: Hero) {
  return JSON.stringify({
    classId: hero.classId,
    level: hero.level,
    xp: hero.xp,
    gold: hero.gold,
    runs: hero.runs,
    stats: hero.stats,
    traits: hero.traits,
    equipped: Object.values(hero.equipped).map((item) => item?.id ?? "none"),
    status: hero.status,
  });
}

function rollEncounterCount(
  duration: DurationDefinition,
  rng: { int: (min: number, max: number) => number },
) {
  return rng.int(duration.encounterRange[0], duration.encounterRange[1]);
}

function applyVariance(amount: number, varianceBand: number, rng: { next: () => number }) {
  const swing = 1 + (rng.next() * 2 - 1) * varianceBand;
  return Math.max(0, Math.round(amount * swing));
}

function sumTotals(hero: Hero, encounters: RunResult["encounters"]) {
  const baseGold = encounters.reduce((sum, encounter) => sum + encounter.gold, 0);
  const greedyMultiplier = hero.traits.includes("Greedy") ? 1.1 : 1;
  const goldGained = Math.round(baseGold * greedyMultiplier);

  return {
    xpGained: encounters.reduce((sum, encounter) => sum + encounter.xp, 0),
    goldGained,
    netGold: goldGained,
    encountersWon: encounters.filter((entry) => entry.outcome === "success").length,
    encountersMixed: encounters.filter((entry) => entry.outcome === "mixed").length,
    encountersLost: encounters.filter((entry) => entry.outcome === "fail").length,
    crits: encounters.filter((entry) => entry.outcome === "crit").length,
  };
}

function pickLootRarity(
  rareLootChance: number,
  crits: number,
  hero: Hero,
  rng: { next: () => number },
): ItemRarity | undefined {
  const classBonus = hero.classId === "mage" ? 0.15 : 0;
  const traitBonus = hero.traits.includes("Relic Hunter") ? 0.08 : 0;
  const adjustedRare = clamp(rareLootChance * (1 + classBonus + traitBonus) + crits * 0.015, 0, 0.8);
  const roll = rng.next();
  if (roll < adjustedRare * 0.18) return "epic";
  if (roll < adjustedRare) return "rare";
  if (roll < adjustedRare + 0.22) return "uncommon";
  return undefined;
}

function rollLoot(
  hero: Hero,
  result: ReturnType<typeof sumTotals>,
  event: RunEvent | undefined,
  rareLootChance: number,
  rng: { next: () => number; int: (min: number, max: number) => number; pick: <T>(items: T[]) => T },
  seed: string,
) {
  const rarity = pickLootRarity(rareLootChance, result.crits, hero, rng);
  const loot: Item[] = [];
  if (rarity) {
    const picked = rng.pick(getItemsByRarity(rarity));
    loot.push(getItemTemplate(picked.templateId, `${seed}-loot-0`));
  }
  if (event?.category === "relic-find") {
    const bonusPool = getItemsByRarity(rarity === "epic" ? "rare" : "uncommon");
    if (bonusPool.length > 0) {
      const picked = rng.pick(bonusPool);
      loot.push(getItemTemplate(picked.templateId, `${seed}-loot-1`));
    }
  }
  return { loot, rarity };
}

function maybeEvent(
  durationHours: DurationDefinition["hours"],
  hero: Hero,
  tuning: TuningState,
  rng: { next: () => number; int: (min: number, max: number) => number },
) {
  const chances = getDurationChances(durationHours, tuning);
  const rogueBonus = hero.classId === "rogue" ? tuning.classEventBonus : 0;
  const eventRoll = rng.next();
  if (eventRoll < clamp(chances.eventChance * (1 + rogueBonus), 0, 0.95)) {
    return { event: pickEvent(rng), eventRoll };
  }
  return { event: undefined, eventRoll };
}

function applyEvent(hero: Hero, event: RunEvent | undefined) {
  const updated = structuredClone(hero);
  let goldDelta = 0;
  if (!event) {
    return { hero: updated, goldDelta };
  }
  if (event.category === "boon") {
    updated.gold += 12;
    goldDelta += 12;
  }
  if (event.category === "hazard") {
    updated.gold = Math.max(0, updated.gold - 8);
    goldDelta -= 8;
  }
  if (event.category === "wound") {
    updated.status = { injured: true, injuryLabel: "road wound" };
  }
  return { hero: updated, goldDelta };
}

function maybeSetback(
  durationHours: DurationDefinition["hours"],
  hero: Hero,
  tuning: TuningState,
  goldGained: number,
  rng: { next: () => number },
) {
  const chances = getDurationChances(durationHours, tuning);
  const setbackRoll = rng.next();
  if (setbackRoll >= chances.setbackChance) {
    return { setback: undefined, setbackRoll };
  }

  const severityRoll = 0.15 + rng.next() * 0.2;
  const mitigation = hero.classId === "fighter" ? tuning.classSetbackMitigation : 0;
  const adjustedSeverity = severityRoll * (1 - mitigation);
  const goldLost = Math.round(goldGained * adjustedSeverity);
  const injuredApplied = rng.next() < 0.25;
  return {
    setback: {
      label: injuredApplied ? "Bruising retreat" : "Frayed supplies",
      goldLost,
      injuredApplied,
    },
    setbackRoll,
  };
}

function maybeTrait(
  durationHours: DurationDefinition["hours"],
  hero: Hero,
  event: RunEvent | undefined,
  tuning: TuningState,
  rng: { next: () => number; int: (min: number, max: number) => number },
) {
  const traitRoll = rng.next();
  const chances = getDurationChances(durationHours, tuning);
  const bonus = event?.category === "omen" ? 0.06 : 0;
  if (traitRoll < chances.traitChance + bonus) {
    return { traitGain: pickTrait(hero, rng), traitRoll };
  }
  return { traitGain: undefined, traitRoll };
}

function buildDecisionHook(heroBefore: Hero, heroAfter: Hero, loot: Item[], event?: RunEvent, setbackInjury = false) {
  const bestLoot = [...loot]
    .map((item) => ({ item, upgrade: compareItemUpgrade(heroBefore, item) }))
    .sort((left, right) => right.upgrade - left.upgrade)[0];

  if (bestLoot && bestLoot.upgrade > 0) {
    return {
      source: "loot",
      title: "Spoils Decision",
      prompt: `${bestLoot.item.name} looks like an upgrade. Keep it in hand or liquidate it.`,
      options: [
        {
          id: `equip_${bestLoot.item.id}`,
          label: "Equip it",
          description: `Use ${bestLoot.item.name} for the next run.`,
          effect: { type: "equip_item", itemId: bestLoot.item.id },
        },
        {
          id: `sell_${bestLoot.item.id}`,
          label: "Sell it",
          description: `Turn it into ${bestLoot.item.sellValue} gold.`,
          effect: { type: "sell_item", itemId: bestLoot.item.id, gold: bestLoot.item.sellValue },
        },
      ],
    } satisfies DecisionHook;
  }

  if (event) {
    return buildEventDecision(event);
  }

  if (setbackInjury && heroAfter.gold >= 12) {
    return {
      source: "setback",
      title: "Shaken But Solvent",
      prompt: "You can pay a healer before the next expedition or save the coin.",
      options: [
        {
          id: "treat_wound",
          label: "Pay the healer",
          description: "Spend 12 gold and clear injured immediately.",
          effect: { type: "clear_injury", goldCost: 12 },
        },
        {
          id: "save_coin",
          label: "Keep the gold",
          description: "Stay injured and hope for a short recovery run later.",
          effect: { type: "none" },
        },
      ],
    } satisfies DecisionHook;
  }

  return undefined;
}

function applyLoot(hero: Hero, loot: Item[]) {
  const updated = structuredClone(hero);
  updated.inventory = [...updated.inventory, ...loot];
  return updated;
}

function applyTrait(hero: Hero, trait?: string) {
  if (!trait || hero.traits.includes(trait as never)) {
    return hero;
  }
  return {
    ...hero,
    traits: [...hero.traits, trait as never],
  };
}

export function applyDecision(hero: Hero, decisionId: string, hook?: DecisionHook) {
  if (!hook) {
    return hero;
  }
  const option = hook.options.find((entry) => entry.id === decisionId);
  if (!option) {
    return hero;
  }

  if (option.effect.type === "equip_item") {
    return equipItem(hero, option.effect.itemId);
  }
  if (option.effect.type === "sell_item") {
    return sellItem(hero, option.effect.itemId, option.effect.gold);
  }
  if (option.effect.type === "gain_gold") {
    return {
      ...hero,
      gold: hero.gold + option.effect.gold,
    };
  }
  if (option.effect.type === "gain_xp") {
    const leveled = applyLevelUps({
      ...hero,
      xp: hero.xp + option.effect.xp,
    });
    return leveled.hero;
  }
  if (option.effect.type === "clear_injury") {
    return {
      ...hero,
      gold: Math.max(0, hero.gold - option.effect.goldCost),
      status: {
        injured: false,
      },
    };
  }
  return hero;
}

export function buildTemplateNarration(result: RunResult) {
  const classDef = CLASS_DEFINITIONS[result.heroAfter.classId];
  const lootLine =
    result.loot.length > 0
      ? `Notable spoils: ${result.loot.map((item) => item.name).join(", ")}.`
      : "No memorable relics turned up this time.";
  const eventLine = result.event ? `${result.event.title}: ${result.event.effect}.` : "No major run event fired.";
  const setbackLine = result.setback
    ? `${result.setback.label} cost ${result.setback.goldLost} gold${result.setback.injuredApplied ? " and left the hero injured" : ""}.`
    : "No major setback hit.";
  return `${classDef.name} finished a ${result.durationHours}h quest with ${result.totals.xpGained} XP and ${result.totals.netGold} net gold. ${eventLine} ${lootLine} ${setbackLine}`;
}

export function runSimulation(options: {
  durationHours: DurationDefinition["hours"];
  hero: Hero;
  tuning: TuningState;
  forcedSeed?: string;
}): RunResult {
  const { durationHours, hero, tuning, forcedSeed } = options;
  const duration = getDurationDefinition(durationHours);
  const seed =
    forcedSeed ??
    createSeed(`${durationHours}:${hero.runs}:${hero.level}:${getHeroSignature(hero)}`);
  const rng = makeRng(seed);
  const chances = getDurationChances(durationHours, tuning);
  const encounterCount = rollEncounterCount(duration, rng);
  const encounterDefs = buildEncounters(encounterCount, hero, rng);
  const encounters = resolveEncounters(encounterDefs, hero, durationHours, chances.varianceBand, rng);
  const totals = sumTotals(hero, encounters);
  const eventResult = maybeEvent(durationHours, hero, tuning, rng);
  const event = eventResult.event;
  const lootResult = rollLoot(hero, totals, event, chances.rareLootChance, rng, seed);
  const traitResult = maybeTrait(durationHours, hero, event, tuning, rng);
  const setbackResult = maybeSetback(durationHours, hero, tuning, totals.goldGained, rng);

  let nextHero = structuredClone(hero);
  nextHero.runs += 1;
  const actualXpGained = applyVariance(totals.xpGained, chances.varianceBand, rng);
  totals.xpGained = actualXpGained;
  nextHero.xp += actualXpGained;
  nextHero.gold += totals.goldGained;

  const eventApplication = applyEvent(nextHero, event);
  nextHero = eventApplication.hero;
  totals.netGold += eventApplication.goldDelta;
  nextHero = applyLoot(nextHero, lootResult.loot);
  nextHero = applyTrait(nextHero, traitResult.traitGain);

  if (setbackResult.setback) {
    nextHero.gold = Math.max(0, nextHero.gold - setbackResult.setback.goldLost);
    totals.netGold = Math.max(0, totals.goldGained - setbackResult.setback.goldLost);
    if (setbackResult.setback.injuredApplied) {
      nextHero.status = { injured: true, injuryLabel: "quest injury" };
    }
  }

  if (durationHours <= 4 && hero.status.injured) {
    nextHero.status = { injured: false };
  }

  const capped = compareAndCap(nextHero);
  nextHero = capped.hero;
  totals.netGold += capped.goldRecovered;
  nextHero.gold += capped.goldRecovered;

  const leveled = applyLevelUps(nextHero);
  nextHero = leveled.hero;

  const decisionHook = buildDecisionHook(
    hero,
    nextHero,
    lootResult.loot,
    event,
    Boolean(setbackResult.setback?.injuredApplied),
  );

  return {
    seed,
    durationHours,
    encounters,
    totals,
    event,
    loot: lootResult.loot,
    traitGain: traitResult.traitGain,
    setback: setbackResult.setback,
    decisionHook,
    levelUps: leveled.levelUps,
    heroBefore: structuredClone(hero),
    heroAfter: nextHero,
    debug: {
      seed,
      encounterCount,
      lootRoll: lootResult.rarity ? 1 : 0,
      traitRoll: traitResult.traitRoll,
      eventRoll: eventResult.eventRoll,
      setbackRoll: setbackResult.setbackRoll,
      durationChances: chances,
      durationLabel: duration.label,
      durationFeel: duration.feel,
    },
  };
}

function compareAndCap(hero: Hero) {
  const capped = structuredClone(hero);
  if (capped.inventory.length <= 8) {
    return { hero: capped, goldRecovered: 0 };
  }

  const inventory = [...capped.inventory];
  let goldRecovered = 0;
  while (inventory.length > 8) {
    inventory.sort((left, right) => {
      const rarityWeight = rarityValue(left.rarity) - rarityValue(right.rarity);
      if (rarityWeight !== 0) return rarityWeight;
      return left.sellValue - right.sellValue;
    });
    const removed = inventory.shift();
    if (removed) {
      goldRecovered += removed.sellValue;
    }
  }
  capped.inventory = inventory;
  return { hero: capped, goldRecovered };
}

function rarityValue(rarity: ItemRarity) {
  if (rarity === "common") return 0;
  if (rarity === "uncommon") return 1;
  if (rarity === "rare") return 2;
  return 3;
}
