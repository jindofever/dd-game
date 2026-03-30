"use client";

import type { NarrationResponse, RunResult } from "@/lib/game/types";

interface ResultsPanelProps {
  result?: RunResult;
  pendingDecision?: RunResult["decisionHook"];
  narration: NarrationResponse;
  isNarrating: boolean;
  onDecision: (decisionId: string) => void;
  onSkipDecision: () => void;
}

export function ResultsPanel({
  result,
  pendingDecision,
  narration,
  isNarrating,
  onDecision,
  onSkipDecision,
}: ResultsPanelProps) {
  return (
    <section className="rounded-[28px] border border-[rgba(62,46,28,0.18)] bg-[var(--panel)] p-5 shadow-card backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Latest Run</p>
          <h2 className="font-display text-3xl">Outcome Ledger</h2>
        </div>
        {isNarrating ? (
          <div className="rounded-full bg-[rgba(57,81,63,0.14)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-moss">
            Narrating
          </div>
        ) : null}
      </div>

      {!result ? (
        <div className="rounded-[24px] border border-dashed border-[rgba(62,46,28,0.2)] p-8 text-center text-[var(--muted)]">
          Your first quest will print the full combat ledger here.
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="XP" value={result.totals.xpGained} />
            <Metric label="Net Gold" value={result.totals.netGold} />
            <Metric label="Encounters" value={result.encounters.length} />
            <Metric label="Seed" value={result.seed.slice(-8)} />
          </div>

          <div className="mt-4 rounded-[24px] border border-[rgba(62,46,28,0.12)] bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Narration</p>
            <p className="mt-2 text-sm leading-7">{narration.summary}</p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-[rgba(62,46,28,0.12)] bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Events and Loot</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>Event: {result.event ? `${result.event.title} (${result.event.effect})` : "None"}</li>
                <li>
                  Loot: {result.loot.length > 0 ? result.loot.map((item) => item.name).join(", ") : "None"}
                </li>
                <li>Trait gain: {result.traitGain ?? "None"}</li>
                <li>
                  Setback: {result.setback ? `${result.setback.label} (-${result.setback.goldLost} gold)` : "None"}
                </li>
              </ul>
            </div>

            <div className="rounded-[24px] border border-[rgba(62,46,28,0.12)] bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Encounter Ledger</p>
              <div className="mt-3 space-y-2 text-sm">
                {result.encounters.map((encounter) => (
                  <div key={`${result.seed}-${encounter.id}-${encounter.roll}`} className="flex justify-between gap-4">
                    <span>{encounter.title}</span>
                    <span className="text-[var(--muted)]">
                      {encounter.outcome} · +{encounter.xp} XP · +{encounter.gold}g
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {pendingDecision ? (
            <div className="mt-4 rounded-[24px] border border-brass/30 bg-[rgba(180,130,60,0.08)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Decision</p>
              <h3 className="mt-2 text-lg font-semibold">{pendingDecision.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{pendingDecision.prompt}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(narration.decisions.length > 0 ? narration.decisions : pendingDecision.options).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onDecision(option.id)}
                    className="rounded-[20px] border border-[rgba(62,46,28,0.14)] bg-white px-4 py-3 text-left transition hover:border-brass"
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">{option.description}</div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onSkipDecision}
                className="mt-3 text-sm text-[var(--muted)] underline underline-offset-4"
              >
                Skip decision
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
