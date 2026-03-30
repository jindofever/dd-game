"use client";

import { startTransition, useEffect, useMemo, useReducer, useState } from "react";
import { CharacterPanel } from "@/components/character-panel";
import { DebugPanel } from "@/components/debug-panel";
import { InventoryPanel } from "@/components/inventory-panel";
import { QuestButtons } from "@/components/quest-buttons";
import { ResultsPanel } from "@/components/results-panel";
import { buildNarrationPayload } from "@/lib/ai/prompt";
import { createMockNarration } from "@/lib/ai/mock-narration";
import { createInitialGameState, loadGame, saveGame } from "@/lib/game/persistence";
import { applyDecision, buildTemplateNarration, runSimulation } from "@/lib/game/simulate";
import type {
  ClassId,
  DurationDefinition,
  GameState,
  NarrationResponse,
  RunResult,
  TuningState,
} from "@/lib/game/types";

type Action =
  | { type: "hydrate"; state: GameState }
  | { type: "reset"; classId: ClassId }
  | { type: "run"; result: RunResult; now: number }
  | { type: "resolve_decision"; decisionId?: string }
  | { type: "set_narration"; narration: NarrationResponse }
  | { type: "narration_failed" }
  | { type: "toggle_debug" }
  | { type: "toggle_ai" }
  | { type: "set_tuning"; key: keyof TuningState; value: number };

function reducer(state: GameState, action: Action): GameState {
  if (action.type === "hydrate") {
    return action.state;
  }

  if (action.type === "reset") {
    return createInitialGameState(action.classId);
  }

  if (action.type === "run") {
    const previousTime = state.analytics.lastRunAt;
    const runGap = previousTime ? action.now - previousTime : 0;
    const runCount = state.analytics.runCount + 1;
    const averageGapMs =
      previousTime && state.analytics.runCount > 0
        ? (state.analytics.averageGapMs * state.analytics.runCount + runGap) / runCount
        : state.analytics.averageGapMs;

    return {
      ...state,
      hero: action.result.heroAfter,
      lastRun: action.result,
      pendingDecision: action.result.decisionHook,
      narration: {
        summary: buildTemplateNarration(action.result),
        decisions:
          action.result.decisionHook?.options.map((option) => ({
            id: option.id,
            label: option.label,
            description: option.description,
          })) ?? [],
      },
      analytics: {
        ...state.analytics,
        runCount,
        averageGapMs,
        lastRunAt: action.now,
        runsByDuration: {
          ...state.analytics.runsByDuration,
          [action.result.durationHours]: (state.analytics.runsByDuration[action.result.durationHours] ?? 0) + 1,
        },
        narrationRequests: state.analytics.narrationRequests + 1,
        decisionCount:
          state.analytics.decisionCount + (action.result.decisionHook ? 1 : 0),
        repeatAfterSetbackCount:
          state.analytics.repeatAfterSetbackCount + (state.lastRun?.setback ? 1 : 0),
      },
    };
  }

  if (action.type === "resolve_decision") {
    return {
      ...state,
      hero: action.decisionId ? applyDecision(state.hero, action.decisionId, state.pendingDecision) : state.hero,
      pendingDecision: undefined,
      analytics: {
        ...state.analytics,
        decisionResolvedCount:
          state.analytics.decisionResolvedCount + (action.decisionId ? 1 : 0),
      },
    };
  }

  if (action.type === "set_narration") {
    return {
      ...state,
      narration: action.narration,
    };
  }

  if (action.type === "narration_failed") {
    return {
      ...state,
      analytics: {
        ...state.analytics,
        narrationFailures: state.analytics.narrationFailures + 1,
      },
    };
  }

  if (action.type === "toggle_debug") {
    return {
      ...state,
      settings: {
        ...state.settings,
        debugOpen: !state.settings.debugOpen,
      },
    };
  }

  if (action.type === "toggle_ai") {
    return {
      ...state,
      settings: {
        ...state.settings,
        aiEnabled: !state.settings.aiEnabled,
      },
    };
  }

  return {
    ...state,
    tuning: {
      ...state.tuning,
      [action.key]: action.value,
    },
  };
}

export default function HomePage() {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialGameState());
  const [hydrated, setHydrated] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [previewRuns, setPreviewRuns] = useState<RunResult[]>([]);

  useEffect(() => {
    dispatch({ type: "hydrate", state: loadGame() });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveGame(state);
  }, [hydrated, state]);

  const lastRun = state.lastRun;

  const sessionSummary = useMemo(() => {
    const favoriteDuration = Object.entries(state.analytics.runsByDuration).sort((left, right) => right[1] - left[1])[0];
    return favoriteDuration && favoriteDuration[1] > 0
      ? `Favorite duration: ${favoriteDuration[0]}h`
      : "No favorite duration yet";
  }, [state.analytics.runsByDuration]);

  const runQuest = (hours: DurationDefinition["hours"], forcedSeed?: string) => {
    const result = runSimulation({
      durationHours: hours,
      hero: state.hero,
      tuning: state.tuning,
      forcedSeed,
    });
    dispatch({ type: "run", result, now: Date.now() });

    startTransition(() => {
      if (!state.settings.aiEnabled) {
        dispatch({ type: "set_narration", narration: createMockNarration(result) });
        return;
      }

      setIsNarrating(true);
      void fetch("/api/narrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          result,
          payload: buildNarrationPayload(result),
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Narration failed");
          }
          return (await response.json()) as NarrationResponse;
        })
        .then((narration) => {
          dispatch({ type: "set_narration", narration });
        })
        .catch(() => {
          dispatch({ type: "narration_failed" });
          dispatch({ type: "set_narration", narration: createMockNarration(result) });
        })
        .finally(() => {
          setIsNarrating(false);
        });
    });
  };

  const rerunSeed = () => {
    if (!lastRun) return;
    runQuest(lastRun.durationHours, lastRun.seed);
  };

  const simulateTwenty = () => {
    const runs = Array.from({ length: 20 }, (_, index) =>
      runSimulation({
        durationHours: 12,
        hero: state.hero,
        tuning: state.tuning,
        forcedSeed: `${state.hero.classId}-preview-${index}`,
      }),
    );
    setPreviewRuns(runs);
  };

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-6 rounded-[32px] border border-[rgba(62,46,28,0.16)] bg-[rgba(255,248,234,0.72)] px-6 py-6 shadow-card backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Quest Unit Prototype</p>
              <h1 className="mt-2 font-display text-5xl leading-none md:text-7xl">Time into trouble.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)] md:text-base">
                Deterministic quest resolution first, fantasy narration second. Tune the 12-hour loop, then see if the
                shorter and longer runs create their own psychology.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
              <HeroBadge label="Session" value={`${state.analytics.runCount} runs`} />
              <HeroBadge label="Trend" value={sessionSummary} />
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <CharacterPanel hero={state.hero} onReset={(classId) => dispatch({ type: "reset", classId })} />

          <div className="space-y-6">
            <QuestButtons onRun={(hours) => runQuest(hours)} />
            <ResultsPanel
              result={state.lastRun}
              pendingDecision={state.pendingDecision}
              narration={state.narration}
              isNarrating={isNarrating}
              onDecision={(decisionId) => dispatch({ type: "resolve_decision", decisionId })}
              onSkipDecision={() => dispatch({ type: "resolve_decision" })}
            />
          </div>

          <InventoryPanel hero={state.hero} />
        </div>

        <div className="mt-6">
          <DebugPanel
            state={state}
            onToggle={() => dispatch({ type: "toggle_debug" })}
            onTuningChange={(key, value) => dispatch({ type: "set_tuning", key, value })}
            onReset={() => dispatch({ type: "reset", classId: state.hero.classId })}
            onToggleAi={() => dispatch({ type: "toggle_ai" })}
            onRerunSeed={rerunSeed}
            onSimulateTwenty={simulateTwenty}
            streakPreview={previewRuns}
          />
        </div>
      </div>
    </main>
  );
}

function HeroBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[rgba(62,46,28,0.12)] bg-white/70 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
