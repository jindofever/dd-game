import type { EquipmentSlot, Hero, Item, ItemRarity } from "@/lib/game/types";

const ITEM_POOL: Record<string, Item> = {
  "rust-ironblade": {
    id: "rust-ironblade",
    templateId: "rust-ironblade",
    name: "Rust Ironblade",
    slot: "weapon",
    rarity: "common",
    statBonus: { might: 1 },
    sellValue: 8,
    tags: ["starter"],
  },
  "marcher-mail": {
    id: "marcher-mail",
    templateId: "marcher-mail",
    name: "Marcher Mail",
    slot: "armor",
    rarity: "common",
    statBonus: { grit: 1 },
    sellValue: 8,
    tags: ["starter"],
  },
  "bronze-dirk": {
    id: "bronze-dirk",
    templateId: "bronze-dirk",
    name: "Bronze Dirk",
    slot: "weapon",
    rarity: "common",
    statBonus: { luck: 1 },
    sellValue: 8,
    tags: ["starter"],
  },
  "shadow-cloak": {
    id: "shadow-cloak",
    templateId: "shadow-cloak",
    name: "Shadow Cloak",
    slot: "armor",
    rarity: "common",
    statBonus: { wit: 1 },
    sellValue: 8,
    tags: ["starter"],
  },
  "ash-staff": {
    id: "ash-staff",
    templateId: "ash-staff",
    name: "Ash Staff",
    slot: "weapon",
    rarity: "common",
    statBonus: { wit: 1 },
    sellValue: 8,
    tags: ["starter"],
  },
  "glyph-band": {
    id: "glyph-band",
    templateId: "glyph-band",
    name: "Glyph Band",
    slot: "trinket",
    rarity: "common",
    statBonus: { wit: 1 },
    sellValue: 8,
    tags: ["starter"],
  },
  "oak-maul": {
    id: "oak-maul",
    templateId: "oak-maul",
    name: "Oak Maul",
    slot: "weapon",
    rarity: "uncommon",
    statBonus: { might: 2 },
    sellValue: 18,
    tags: ["loot"],
  },
  "fenknife": {
    id: "fenknife",
    templateId: "fenknife",
    name: "Fenknife",
    slot: "weapon",
    rarity: "uncommon",
    statBonus: { luck: 2 },
    sellValue: 18,
    tags: ["loot"],
  },
  "sigil-lantern": {
    id: "sigil-lantern",
    templateId: "sigil-lantern",
    name: "Sigil Lantern",
    slot: "trinket",
    rarity: "uncommon",
    statBonus: { wit: 2 },
    sellValue: 18,
    tags: ["loot"],
  },
  "watcher-mail": {
    id: "watcher-mail",
    templateId: "watcher-mail",
    name: "Watcher Mail",
    slot: "armor",
    rarity: "uncommon",
    statBonus: { grit: 2 },
    sellValue: 18,
    tags: ["loot"],
  },
  "moonlit-charm": {
    id: "moonlit-charm",
    templateId: "moonlit-charm",
    name: "Moonlit Charm",
    slot: "trinket",
    rarity: "rare",
    statBonus: { luck: 2, wit: 1 },
    sellValue: 40,
    tags: ["loot", "rare"],
  },
  "wyvern-spike": {
    id: "wyvern-spike",
    templateId: "wyvern-spike",
    name: "Wyvern Spike",
    slot: "weapon",
    rarity: "rare",
    statBonus: { might: 2, grit: 1 },
    sellValue: 42,
    tags: ["loot", "rare"],
  },
  "runeplate": {
    id: "runeplate",
    templateId: "runeplate",
    name: "Runeplate",
    slot: "armor",
    rarity: "rare",
    statBonus: { grit: 2, wit: 1 },
    sellValue: 40,
    tags: ["loot", "rare"],
  },
  "ember-crown": {
    id: "ember-crown",
    templateId: "ember-crown",
    name: "Ember Crown",
    slot: "trinket",
    rarity: "epic",
    statBonus: { wit: 2, luck: 2 },
    sellValue: 80,
    tags: ["loot", "epic"],
  },
  "bastion-oathblade": {
    id: "bastion-oathblade",
    templateId: "bastion-oathblade",
    name: "Bastion Oathblade",
    slot: "weapon",
    rarity: "epic",
    statBonus: { might: 3, grit: 1 },
    sellValue: 82,
    tags: ["loot", "epic"],
  },
};

const RARITY_ORDER: ItemRarity[] = ["common", "uncommon", "rare", "epic"];

export function getItemTemplate(id: string, instanceId = "base"): Item {
  const item = ITEM_POOL[id];
  if (!item) {
    throw new Error(`Missing item template ${id}`);
  }
  return {
    ...structuredClone(item),
    id: `${id}__${instanceId}`,
  };
}

export function getItemsByRarity(rarity: ItemRarity) {
  return Object.values(ITEM_POOL).filter((item) => item.rarity === rarity && item.tags.includes("loot"));
}

export function getItemPower(item?: Item) {
  if (!item) {
    return 0;
  }
  return Object.values(item.statBonus).reduce((sum, value) => sum + (value ?? 0), 0);
}

export function compareItemUpgrade(hero: Hero, item: Item) {
  const equipped = hero.equipped[item.slot];
  return getItemPower(item) - getItemPower(equipped);
}

export function applyInventoryCap(hero: Hero) {
  const inventory = [...hero.inventory];
  let goldRecovered = 0;

  while (inventory.length > 8) {
    inventory.sort((left, right) => {
      const rarityDelta = RARITY_ORDER.indexOf(left.rarity) - RARITY_ORDER.indexOf(right.rarity);
      if (rarityDelta !== 0) {
        return rarityDelta;
      }
      return left.sellValue - right.sellValue;
    });
    const removed = inventory.shift();
    if (removed) {
      goldRecovered += removed.sellValue;
    }
  }

  return {
    inventory,
    goldRecovered,
  };
}

export function equipItem(hero: Hero, itemId: string): Hero {
  const item = hero.inventory.find((entry) => entry.id === itemId);
  if (!item) {
    return hero;
  }
  return {
    ...hero,
    equipped: {
      ...hero.equipped,
      [item.slot]: item,
    },
  };
}

export function sellItem(hero: Hero, itemId: string, bonusGold: number): Hero {
  const keptInventory = hero.inventory.filter((item) => item.id !== itemId);
  const equipped = { ...hero.equipped };
  const sold = hero.inventory.find((item) => item.id === itemId);
  if (sold && equipped[sold.slot]?.id === sold.id) {
    delete equipped[sold.slot];
  }
  return {
    ...hero,
    inventory: keptInventory,
    equipped,
    gold: hero.gold + bonusGold,
  };
}

export function getSlotLabel(slot: EquipmentSlot) {
  if (slot === "weapon") return "Weapon";
  if (slot === "armor") return "Armor";
  return "Trinket";
}
