import { DEFAULT_RULES, EMPTY_COUNTS } from "./score.js";

export const STORAGE_KEY = "gostop-scoreboard-v1";

const DEFAULT_PLAYERS = [
  { id: "player-1", name: "가다서", total: 0, entries: [], counts: { ...EMPTY_COUNTS } },
  { id: "player-2", name: "가다서맘", total: 0, entries: [], counts: { ...EMPTY_COUNTS } },
  { id: "player-3", name: "가다서 빠", total: 0, entries: [], counts: { ...EMPTY_COUNTS } },
];

export function createInitialState() {
  return {
    players: structuredClone(DEFAULT_PLAYERS),
    rules: { ...DEFAULT_RULES },
    undoStack: [],
    completedRounds: [],
    settlements: [],
  };
}

function isValidState(value) {
  return (
    value &&
    Array.isArray(value.players) &&
    value.players.length >= 2 &&
    value.players.length <= 4 &&
    value.players.every(
      (player) =>
        typeof player.id === "string" &&
        typeof player.name === "string" &&
        Number.isFinite(player.total) &&
        Array.isArray(player.entries) &&
        player.counts &&
        Object.keys(EMPTY_COUNTS).every((key) => Number.isFinite(player.counts[key])),
    ) &&
    value.rules &&
    ["threeGwangWithBiIsTwo", "meongTta", "goMultiplier"].every(
      (key) => typeof value.rules[key] === "boolean",
    ) &&
    Array.isArray(value.undoStack)
  );
}

export function loadSavedState(saved) {
  try {
    if (!saved) return { state: createInitialState(), notice: "" };
    const parsed = JSON.parse(saved);
    if (!isValidState(parsed)) {
      return {
        state: createInitialState(),
        notice: "저장된 점수판 형식이 맞지 않아 새 점수판을 열었습니다. 필요한 기록을 확인해 주세요.",
      };
    }

    parsed.completedRounds = Array.isArray(parsed.completedRounds) ? parsed.completedRounds : [];
    parsed.settlements = Array.isArray(parsed.settlements) ? parsed.settlements : [];
    return { state: parsed, notice: "" };
  } catch {
    return {
      state: createInitialState(),
      notice: "이 브라우저에서 저장 기록을 읽지 못했습니다. 새 점수판으로 시작합니다.",
    };
  }
}
