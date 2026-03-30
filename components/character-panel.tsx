"use client";

import { CLASS_DEFINITIONS } from "@/lib/game/classes";
import { TRAIT_DESCRIPTIONS } from "@/lib/game/constants";
import type { ClassId, Hero } from "@/lib/game/types";

interface CharacterPanelProps {
  hero: Hero;
  onReset: (classId: ClassId) => void;
}

export function CharacterPanel({ hero, onReset }: CharacterPanelProps) {
  const classDef = CLASS_DEFINITIONS[hero.classId];

  return (
    <section className="rounded-[28px] border border-[rgba(62,46,28,0.18)] bg-[var(--panel)] p-5 shadow-card backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Adventurer</p>
          <h2 className="font-display text-3xl">{classDef.name}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{classDef.fantasy}</p>
        </div>
        <div className="rounded-full border border-[rgba(62,46,28,0.12)] bg-white/70 px-3 py-1 text-sm">
          Level {hero.level}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <StatCard label="Might" value={hero.stats.might} />
        <StatCard label="Wit" value={hero.stats.wit} />
        <StatCard label="Grit" value={hero.stats.grit} />
        <StatCard label="Luck" value={hero.stats.luck} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="XP" value={hero.xp} />
        <Metric label="Gold" value={hero.gold} />
        <Metric label="Runs" value={hero.runs} />
        <Metric label="Status" value={hero.status.injured ? "Injured" : "Ready"} />
      </div>

      <div className="mt-5 rounded-2xl border border-[rgba(62,46,28,0.12)] bg-white/60 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Traits</p>
        {hero.traits.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No permanent traits yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {hero.traits.map((trait) => (
              <li key={trait}>
                <span className="font-medium">{trait}</span>
                <span className="text-[var(--muted)]">: {TRAIT_DESCRIPTIONS[trait]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Restart As</p>
        <div className="grid grid-cols-3 gap-2">
          {(["fighter", "rogue", "mage"] as ClassId[]).map((classId) => (
            <button
              key={classId}
              type="button"
              onClick={() => onReset(classId)}
              className={`rounded-2xl border px-3 py-2 text-sm transition ${
                hero.classId === classId
                  ? "border-brass bg-brass/15 font-medium"
                  : "border-[rgba(62,46,28,0.12)] bg-white/70 hover:border-brass/60"
              }`}
            >
              {CLASS_DEFINITIONS[classId].name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[rgba(62,46,28,0.1)] bg-white/70 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-[rgba(53,42,33,0.06)] px-3 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
