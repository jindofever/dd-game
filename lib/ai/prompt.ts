import type { NarrationResponse, RunResult } from "@/lib/game/types";

export const NARRATION_SYSTEM_PROMPT = `You are a restrained fantasy narrator for an idle RPG prototype.
You describe only the facts in the input JSON.
Do not invent mechanics, items, enemies, losses, rewards, or choices not present.
Keep the tone vivid but concise.
Return JSON only with:
{
  "summary": "70-120 words",
  "decisions": [{ "id": "...", "label": "...", "description": "..." }]
}
If no decisions are provided in the input, return an empty decisions array.
When decisions are provided, preserve the exact ids and mechanics; only rewrite wording.`;

export function buildNarrationPayload(result: RunResult) {
  return {
    hero: {
      classId: result.heroAfter.classId,
      level: result.heroAfter.level,
      traits: result.heroAfter.traits,
      equipped: Object.values(result.heroAfter.equipped)
        .filter(Boolean)
        .map((item) => item?.name),
    },
    quest: {
      durationHours: result.durationHours,
      seed: result.seed,
    },
    summaryData: {
      encountersWon: result.totals.encountersWon + result.totals.crits,
      encountersMixed: result.totals.encountersMixed,
      encountersLost: result.totals.encountersLost,
      xpGained: result.totals.xpGained,
      goldGained: result.totals.netGold,
      loot: result.loot.map((item) => item.name),
      event: result.event?.title ?? null,
      setback: result.setback?.label ?? null,
      traitGain: result.traitGain ?? null,
    },
    decisionHooks:
      result.decisionHook?.options.map((option) => ({
        id: option.id,
        effect:
          option.effect.type === "equip_item"
            ? `Equip ${option.effect.itemId}`
            : option.effect.type === "sell_item"
              ? `Sell for ${option.effect.gold} gold`
              : option.effect.type === "gain_gold"
                ? `Gain ${option.effect.gold} gold`
                : option.effect.type === "gain_xp"
                  ? `Gain ${option.effect.xp} XP`
                  : option.effect.type === "clear_injury"
                    ? `Spend ${option.effect.goldCost} gold to remove injured`
                    : "No additional mechanical effect",
      })) ?? [],
  };
}

export function sanitizeNarrationResponse(value: unknown): NarrationResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.summary !== "string" || !Array.isArray(candidate.decisions)) {
    return null;
  }

  const decisions = candidate.decisions.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }
    const option = entry as Record<string, unknown>;
    if (
      typeof option.id !== "string" ||
      typeof option.label !== "string" ||
      typeof option.description !== "string"
    ) {
      return [];
    }
    return [
      {
        id: option.id,
        label: option.label,
        description: option.description,
      },
    ];
  });

  return {
    summary: candidate.summary,
    decisions,
  };
}
