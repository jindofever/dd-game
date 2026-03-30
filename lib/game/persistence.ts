import { DEFAULT_TUNING, SAVE_KEY } from "@/lib/game/constants";
import { createNewHero } from "@/lib/game/classes";
import type {
  ClassId,
  GameState,
  NarrationResponse,
  SessionAnalytics,
} from "@/lib/game/types";

export function createEmptyNarration(): NarrationResponse {
  return {
    summary: "Pick a quest duration to see what kind of trouble your adventurer finds.",
    decisions: [],
  };
}

export function createAnalytics(): SessionAnalytics {
  return {
    sessionStartedAt: Date.now(),
    runCount: 0,
    runsByDuration: { "1": 0, "4": 0, "8": 0, "12": 0, "24": 0 },
    averageGapMs: 0,
    narrationRequests: 0,
    narrationFailures: 0,
    decisionCount: 0,
    decisionResolvedCount: 0,
    repeatAfterSetbackCount: 0,
  };
}

export function createInitialGameState(classId: ClassId = "fighter"): GameState {
  return {
    hero: createNewHero(classId),
    narration: createEmptyNarration(),
    tuning: { ...DEFAULT_TUNING },
    analytics: createAnalytics(),
    settings: {
      aiEnabled: true,
      debugOpen: true,
    },
  };
}

export function loadGame(): GameState {
  if (typeof window === "undefined") {
    return createInitialGameState();
  }

  const raw = window.localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return createInitialGameState();
  }

  try {
    const parsed = JSON.parse(raw) as GameState;
    return {
      ...createInitialGameState(parsed.hero.classId),
      ...parsed,
      tuning: {
        ...DEFAULT_TUNING,
        ...parsed.tuning,
      },
      analytics: {
        ...createAnalytics(),
        ...parsed.analytics,
      },
    };
  } catch {
    return createInitialGameState();
  }
}

export function saveGame(state: GameState) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}
