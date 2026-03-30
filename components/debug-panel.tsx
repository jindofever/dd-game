"use client";

import type { GameState, RunResult, TuningState } from "@/lib/game/types";

interface DebugPanelProps {
  state: GameState;
  onToggle: () => void;
  onTuningChange: (key: keyof TuningState, value: number) => void;
  onReset: () => void;
  onToggleAi: () => void;
  onRerunSeed: () => void;
  onSimulateTwenty: () => void;
  streakPreview: RunResult[];
}

export function DebugPanel({
  state,
  onToggle,
  onTuningChange,
  onReset,
  onToggleAi,
  onRerunSeed,
  onSimulateTwenty,
  streakPreview,
}: DebugPanelProps) {
  const { lastRun } = state;

  return (
    <section className="rounded-[28px] border border-[rgba(62,46,28,0.18)] bg-[rgba(40,36,34,0.9)] p-5 text-stone-100 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Debug and Tuning</p>
          <h2 className="font-display text-3xl">Design Console</h2>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-white/15 px-3 py-1 text-sm"
        >
          {state.settings.debugOpen ? "Collapse" : "Expand"}
        </button>
      </div>

      {state.settings.debugOpen ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <DebugMetric label="Session runs" value={state.analytics.runCount} />
            <DebugMetric label="Avg gap" value={`${Math.round(state.analytics.averageGapMs / 1000)}s`} />
            <DebugMetric label="Decision rate" value={`${state.analytics.decisionResolvedCount}/${state.analytics.decisionCount}`} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(state.tuning) as Array<keyof TuningState>).map((key) => (
              <label key={key} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-400">{key}</div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={state.tuning[key]}
                  onChange={(event) => onTuningChange(key, Number(event.target.value))}
                  className="w-full"
                />
                <div className="mt-2 text-right text-stone-300">{state.tuning[key].toFixed(2)}</div>
              </label>
            ))}
          </div>

          {lastRun ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Last Run Math</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div>Seed: {lastRun.debug.seed}</div>
                  <div>Duration: {lastRun.durationHours}h ({lastRun.debug.durationFeel})</div>
                  <div>Event roll: {lastRun.debug.eventRoll.toFixed(3)}</div>
                  <div>Trait roll: {lastRun.debug.traitRoll.toFixed(3)}</div>
                  <div>Setback roll: {lastRun.debug.setbackRoll.toFixed(3)}</div>
                  <div>Loot fired: {lastRun.debug.lootRoll ? "yes" : "no"}</div>
                </div>
                <div className="space-y-2">
                  <div>Event chance: {(lastRun.debug.durationChances.eventChance * 100).toFixed(1)}%</div>
                  <div>Rare loot chance: {(lastRun.debug.durationChances.rareLootChance * 100).toFixed(1)}%</div>
                  <div>Trait chance: {(lastRun.debug.durationChances.traitChance * 100).toFixed(1)}%</div>
                  <div>Setback chance: {(lastRun.debug.durationChances.setbackChance * 100).toFixed(1)}%</div>
                  <div>Variance band: {(lastRun.debug.durationChances.varianceBand * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onRerunSeed} className="rounded-full border border-white/15 px-4 py-2 text-sm">
              Rerun same seed
            </button>
            <button type="button" onClick={onSimulateTwenty} className="rounded-full border border-white/15 px-4 py-2 text-sm">
              Simulate 20x
            </button>
            <button type="button" onClick={onToggleAi} className="rounded-full border border-white/15 px-4 py-2 text-sm">
              {state.settings.aiEnabled ? "Disable AI" : "Enable AI"}
            </button>
            <button type="button" onClick={onReset} className="rounded-full border border-white/15 px-4 py-2 text-sm">
              Reset save
            </button>
          </div>

          {streakPreview.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">20 Run Preview</p>
              <div className="mt-3 space-y-1 text-stone-300">
                {streakPreview.slice(0, 8).map((run) => (
                  <div key={run.seed}>
                    {run.durationHours}h · {run.totals.netGold}g · {run.totals.xpGained} XP · {run.loot.length} loot
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function DebugMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs uppercase tracking-[0.18em] text-stone-400">{label}</div>
      <div className="mt-1 text-lg font-medium">{value}</div>
    </div>
  );
}
