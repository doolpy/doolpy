import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState, loadSavedState } from "./state.js";

test("new scoreboard defaults use the configured Korean player names", () => {
  const state = createInitialState();

  assert.deepEqual(
    state.players.map(({ name }) => name),
    ["가다서", "가다서맘", "가다서 빠"],
  );
});

test("loading an untouched game named 1번 and 2번 preserves its players and state", () => {
  const original = createInitialState();
  original.players = original.players.slice(0, 2).map((player, index) => ({
    ...player,
    id: `saved-player-${index + 1}`,
    name: `${index + 1}번`,
  }));
  original.rules = { ...original.rules, threeGwangWithBiIsTwo: true };

  const loaded = loadSavedState(JSON.stringify(original));

  assert.equal(loaded.notice, "");
  assert.deepEqual(loaded.state.players, original.players);
  assert.deepEqual(loaded.state.rules, original.rules);
});
