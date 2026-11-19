import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateScore,
  calculateSettlement,
  DEFAULT_RULES,
  EMPTY_COUNTS,
} from "./score.js";

test("광 점수는 3광, 4광, 5광 기준을 적용한다", () => {
  assert.equal(calculateScore({ ...EMPTY_COUNTS, gwang: 2 }).categoryPoints.gwang, 0);
  assert.equal(calculateScore({ ...EMPTY_COUNTS, gwang: 3 }).categoryPoints.gwang, 3);
  assert.equal(calculateScore({ ...EMPTY_COUNTS, gwang: 4 }).categoryPoints.gwang, 4);
  assert.equal(calculateScore({ ...EMPTY_COUNTS, gwang: 5 }).categoryPoints.gwang, 15);
});

test("비광 포함 3광 규칙은 선택했을 때만 2점으로 계산한다", () => {
  assert.equal(
    calculateScore({ ...EMPTY_COUNTS, gwang: 3 }, { ...DEFAULT_RULES, threeGwangWithBiIsTwo: true })
      .categoryPoints.gwang,
    2,
  );
});

test("열끗과 띠는 다섯 장부터 1점, 추가 한 장마다 1점이다", () => {
  const result = calculateScore({ ...EMPTY_COUNTS, animals: 7, ribbons: 6 });
  assert.equal(result.categoryPoints.animals, 3);
  assert.equal(result.categoryPoints.ribbons, 2);
  assert.equal(result.meongTtaMultiplier, 2);
});

test("피는 쌍피를 두 장으로 세고 열 장부터 점수를 낸다", () => {
  assert.equal(calculateScore({ ...EMPTY_COUNTS, pi: 9 }).categoryPoints.pi, 0);
  assert.equal(calculateScore({ ...EMPTY_COUNTS, pi: 8, doublePi: 1 }).categoryPoints.pi, 1);
});

test("3고부터 두 배씩 커지며 멍따와 곱해진다", () => {
  const counts = { ...EMPTY_COUNTS, animals: 7, go: 4 };
  const result = calculateScore(counts);
  assert.equal(result.basePoints, 3);
  assert.equal(result.goMultiplier, 4);
  assert.equal(result.meongTtaMultiplier, 2);
  assert.equal(result.total, 24);
});

test("규칙을 끄면 해당 배수만 빠지고 기본 점수는 유지된다", () => {
  const result = calculateScore(
    { ...EMPTY_COUNTS, animals: 7, go: 3 },
    { ...DEFAULT_RULES, goMultiplier: false, meongTta: false },
  );
  assert.equal(result.basePoints, 3);
  assert.equal(result.total, 3);
});

test("소수와 음수 입력은 정수 카드 수로 안전하게 정리한다", () => {
  const result = calculateScore({ ...EMPTY_COUNTS, gwang: -3, animals: 7.8, go: -1 });
  assert.equal(result.categoryPoints.gwang, 0);
  assert.equal(result.categoryPoints.animals, 3);
  assert.equal(result.goMultiplier, 1);
});

test("점수 정산은 5판 점수의 균등 배분 차액을 서로 주고받을 금액으로 만든다", () => {
  const players = [
    { id: "a", name: "가" },
    { id: "b", name: "나" },
    { id: "c", name: "다" },
  ];
  const rounds = [
    { scores: [{ playerId: "a", amount: 20 }, { playerId: "b", amount: 8 }, { playerId: "c", amount: 2 }] },
  ];
  const result = calculateSettlement(players, rounds);

  assert.deepEqual(result.totals.map((player) => [player.points, player.target]), [
    [20, 10],
    [8, 10],
    [2, 10],
  ]);
  assert.deepEqual(result.transfers, [
    { fromPlayerId: "b", fromPlayerName: "나", toPlayerId: "a", toPlayerName: "가", amount: 2 },
    { fromPlayerId: "c", fromPlayerName: "다", toPlayerId: "a", toPlayerName: "가", amount: 8 },
  ]);
});

test("나누어 떨어지지 않는 점수와 같은 점수는 정수로 빠짐없이 정산한다", () => {
  const players = [
    { id: "a", name: "가" },
    { id: "b", name: "나" },
    { id: "c", name: "다" },
  ];
  const result = calculateSettlement(players, [
    { scores: [{ playerId: "a", amount: 5 }, { playerId: "b", amount: 2 }, { playerId: "c", amount: 1 }] },
  ]);
  const sentPoints = result.transfers.reduce((sum, transfer) => sum + transfer.amount, 0);

  assert.deepEqual(result.totals.map((player) => player.target), [3, 3, 2]);
  assert.equal(sentPoints, 2);
  assert.equal(result.transfers.reduce((sum, transfer) => sum + transfer.amount, 0), sentPoints);
});

test("점수가 같으면 정산 송금이 발생하지 않는다", () => {
  const result = calculateSettlement(
    [{ id: "a", name: "가" }, { id: "b", name: "나" }],
    [{ scores: [{ playerId: "a", amount: 7 }, { playerId: "b", amount: 7 }] }],
  );
  assert.deepEqual(result.transfers, []);
});

test("삭제된 플레이어의 5판 기록도 정산에서 빠지지 않는다", () => {
  const result = calculateSettlement(
    [{ id: "b", name: "나" }, { id: "c", name: "다" }],
    [{
      scores: [
        { playerId: "a", playerName: "가", amount: 10 },
        { playerId: "b", playerName: "나", amount: 5 },
        { playerId: "c", playerName: "다", amount: 5 },
      ],
    }],
  );

  assert.deepEqual(result.totals.map((player) => player.playerName), ["나", "다", "가"]);
  assert.equal(result.totals.reduce((sum, player) => sum + player.points, 0), 20);
  assert.deepEqual(
    result.transfers.map(({ fromPlayerName, toPlayerName, amount }) => [
      fromPlayerName,
      toPlayerName,
      amount,
    ]),
    [["나", "가", 2], ["다", "가", 1]],
  );
});
