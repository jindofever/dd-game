import { CLASS_DEFINITIONS } from "@/lib/game/classes";
import { buildTemplateNarration } from "@/lib/game/simulate";
import type { NarrationResponse, RunResult } from "@/lib/game/types";

export function createMockNarration(result: RunResult): NarrationResponse {
  const className = CLASS_DEFINITIONS[result.heroAfter.classId].name;
  const encounterTexture =
    result.totals.crits > 0
      ? "One encounter broke especially hard in your favor."
      : result.totals.encountersLost > 0
        ? "The route fought back more than usual."
        : "The route stayed mostly under control.";
  const eventLine = result.event ? `${result.event.title} tilted the pace.` : "No strange side scene interrupted the tempo.";
  const traitLine = result.traitGain ? `A lasting trait emerged: ${result.traitGain}.` : "";
  const summary = `${buildTemplateNarration(result)} ${className} felt ${result.debug.durationFeel}. ${encounterTexture} ${eventLine} ${traitLine}`.trim();

  return {
    summary,
    decisions:
      result.decisionHook?.options.map((option) => ({
        id: option.id,
        label: option.label,
        description: option.description,
      })) ?? [],
  };
}
