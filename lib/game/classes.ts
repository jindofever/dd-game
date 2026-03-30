import { getItemTemplate } from "@/lib/game/loot";
import type { ClassDefinition, ClassId, Hero } from "@/lib/game/types";

export const CLASS_DEFINITIONS: Record<ClassId, ClassDefinition> = {
  fighter: {
    id: "fighter",
    name: "Fighter",
    fantasy: "A scarred frontliner who turns risk into survivable profit.",
    startingStats: { might: 4, wit: 2, grit: 4, luck: 2 },
    primaryStat: "might",
    secondaryStat: "grit",
    passiveLabel: "-20% setback severity",
    encounterBias: {
      combat: 0.42,
      hazard: 0.25,
      mystic: 0.13,
      opportunity: 0.2,
    },
    startingGear: [getItemTemplate("rust-ironblade", "fighter-weapon"), getItemTemplate("marcher-mail", "fighter-armor")],
  },
  rogue: {
    id: "rogue",
    name: "Rogue",
    fantasy: "A fast opportunist who digs extra stories out of the margins.",
    startingStats: { might: 2, wit: 4, grit: 2, luck: 4 },
    primaryStat: "wit",
    secondaryStat: "luck",
    passiveLabel: "+15% event chance",
    encounterBias: {
      combat: 0.18,
      hazard: 0.22,
      mystic: 0.18,
      opportunity: 0.42,
    },
    startingGear: [getItemTemplate("bronze-dirk", "rogue-weapon"), getItemTemplate("shadow-cloak", "rogue-armor")],
  },
  mage: {
    id: "mage",
    name: "Mage",
    fantasy: "A disciplined caster who makes long quests feel stranger and richer.",
    startingStats: { might: 1, wit: 5, grit: 2, luck: 3 },
    primaryStat: "wit",
    secondaryStat: "luck",
    passiveLabel: "+15% rare loot chance",
    encounterBias: {
      combat: 0.14,
      hazard: 0.16,
      mystic: 0.48,
      opportunity: 0.22,
    },
    startingGear: [getItemTemplate("ash-staff", "mage-weapon"), getItemTemplate("glyph-band", "mage-trinket")],
  },
};

export function createNewHero(classId: ClassId): Hero {
  const definition = CLASS_DEFINITIONS[classId];
  const equipped = definition.startingGear.reduce<Hero["equipped"]>((acc, item) => {
    acc[item.slot] = item;
    return acc;
  }, {});

  return {
    classId,
    level: 1,
    xp: 0,
    gold: 24,
    runs: 0,
    stats: { ...definition.startingStats },
    traits: [],
    equipped,
    inventory: [...definition.startingGear],
    status: {
      injured: false,
    },
  };
}
