"use client";

import { DURATION_DEFINITIONS } from "@/lib/game/constants";
import type { DurationDefinition } from "@/lib/game/types";

interface QuestButtonsProps {
  disabled?: boolean;
  onRun: (hours: DurationDefinition["hours"]) => void;
}

export function QuestButtons({ disabled, onRun }: QuestButtonsProps) {
  return (
    <section className="rounded-[28px] border border-[rgba(62,46,28,0.18)] bg-[var(--panel)] p-5 shadow-card backdrop-blur">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Quest Board</p>
        <h2 className="font-display text-3xl">Choose a Quest Unit</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Every button resolves instantly. Pick a mood, not a timer.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {DURATION_DEFINITIONS.map((duration) => (
          <button
            key={duration.hours}
            type="button"
            disabled={disabled}
            onClick={() => onRun(duration.hours)}
            className="group rounded-[24px] border border-[rgba(62,46,28,0.12)] bg-white/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-brass hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-3xl">{duration.label}</span>
              <span className="rounded-full bg-[rgba(180,130,60,0.14)] px-2 py-1 text-xs uppercase tracking-[0.2em] text-brass">
                {duration.feel}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium">{duration.promise}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              {duration.encounterRange[0]}-{duration.encounterRange[1]} encounters
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
