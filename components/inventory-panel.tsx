"use client";

import { getSlotLabel } from "@/lib/game/loot";
import type { Hero } from "@/lib/game/types";

export function InventoryPanel({ hero }: { hero: Hero }) {
  return (
    <section className="rounded-[28px] border border-[rgba(62,46,28,0.18)] bg-[var(--panel)] p-5 shadow-card backdrop-blur">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Loadout</p>
        <h2 className="font-display text-3xl">Gear and Stash</h2>
      </div>

      <div className="space-y-3">
        {(["weapon", "armor", "trinket"] as const).map((slot) => (
          <div key={slot} className="rounded-2xl border border-[rgba(62,46,28,0.12)] bg-white/70 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{getSlotLabel(slot)}</div>
            <div className="mt-1 font-medium">{hero.equipped[slot]?.name ?? "Empty"}</div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
          Inventory {hero.inventory.length}/8
        </p>
        <div className="space-y-2">
          {hero.inventory.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[rgba(62,46,28,0.1)] bg-white/65 px-3 py-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{item.rarity}</span>
              </div>
              <div className="mt-1 text-[var(--muted)]">
                {Object.entries(item.statBonus)
                  .map(([stat, value]) => `${stat} +${value}`)
                  .join(", ")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
