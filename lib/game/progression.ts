import { CLASS_DEFINITIONS } from "@/lib/game/classes";
import type { Hero, LevelUp, StatKey } from "@/lib/game/types";

export function xpToNext(level: number) {
  return 100 + (level - 1) * 40;
}

export function applyLevelUps(hero: Hero) {
  const updated = structuredClone(hero);
  const levelUps: LevelUp[] = [];
  const classDef = CLASS_DEFINITIONS[hero.classId];

  while (updated.level < 8 && updated.xp >= xpToNext(updated.level)) {
    updated.xp -= xpToNext(updated.level);
    updated.level += 1;
    const increased: StatKey[] = [];
    updated.stats[classDef.primaryStat] += 1;
    increased.push(classDef.primaryStat);

    if (updated.level % 2 === 0) {
      updated.stats[classDef.secondaryStat] += 1;
      increased.push(classDef.secondaryStat);
    }

    levelUps.push({
      newLevel: updated.level,
      increased,
    });
  }

  return { hero: updated, levelUps };
}
