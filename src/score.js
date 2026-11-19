export const DEFAULT_RULES = {
  threeGwangWithBiIsTwo: false,
  meongTta: true,
  goMultiplier: true,
};

export const EMPTY_COUNTS = {
  gwang: 0,
  animals: 0,
  ribbons: 0,
  pi: 0,
  doublePi: 0,
  go: 0,
};

function wholeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

function countScore(count, minimum) {
  return count >= minimum ? count - minimum + 1 : 0;
}

export function calculateScore(counts, rules = DEFAULT_RULES) {
  const gwang = Math.min(5, wholeCount(counts.gwang));
  const animals = wholeCount(counts.animals);
  const ribbons = wholeCount(counts.ribbons);
  const pi = wholeCount(counts.pi);
  const doublePi = wholeCount(counts.doublePi);
  const go = wholeCount(counts.go);

  let gwangPoints = gwang === 5 ? 15 : gwang === 4 ? 4 : gwang === 3 ? 3 : 0;
  if (gwang === 3 && rules.threeGwangWithBiIsTwo) gwangPoints = 2;

  const categoryPoints = {
    gwang: gwangPoints,
    animals: countScore(animals, 5),
    ribbons: countScore(ribbons, 5),
    pi: countScore(pi + doublePi * 2, 10),
  };
  const basePoints = Object.values(categoryPoints).reduce((sum, value) => sum + value, 0);
  const goMultiplier = rules.goMultiplier && go >= 3 ? 2 ** (go - 2) : 1;
  const meongTtaMultiplier = rules.meongTta && animals >= 7 ? 2 : 1;
  const total = basePoints * goMultiplier * meongTtaMultiplier;

  return {
    categoryPoints,
    basePoints,
    goMultiplier,
    meongTtaMultiplier,
    total,
  };
}

export function calculateSettlement(players, rounds) {
  const settlementPlayers = new Map(
    players.map((player) => [player.id, { id: player.id, name: player.name }]),
  );
  rounds.forEach((round) => {
    round.scores.forEach((score) => {
      if (!settlementPlayers.has(score.playerId)) {
        settlementPlayers.set(score.playerId, {
          id: score.playerId,
          name: score.playerName ?? score.playerId,
        });
      }
    });
  });
  const participants = [...settlementPlayers.values()];
  const totals = participants.map((player) =>
    rounds.reduce((sum, round) => {
      const roundScore = round.scores.find((score) => score.playerId === player.id);
      return sum + (roundScore?.amount ?? 0);
    }, 0),
  );
  const totalPoints = totals.reduce((sum, points) => sum + points, 0);
  const baseShare = participants.length ? Math.floor(totalPoints / participants.length) : 0;
  const remainder = participants.length ? totalPoints % participants.length : 0;
  const priority = participants
    .map((player, index) => ({ playerId: player.id, index, points: totals[index] }))
    .sort((left, right) => right.points - left.points || left.index - right.index);
  const targets = totals.map(() => baseShare);
  priority.slice(0, remainder).forEach(({ index }) => {
    targets[index] += 1;
  });

  const receivers = participants
    .map((player, index) => ({
      playerId: player.id,
      playerName: player.name,
      balance: totals[index] - targets[index],
    }))
    .filter((player) => player.balance > 0);
  const payers = participants
    .map((player, index) => ({
      playerId: player.id,
      playerName: player.name,
      balance: targets[index] - totals[index],
    }))
    .filter((player) => player.balance > 0);
  const transfers = [];

  while (payers.length && receivers.length) {
    const payer = payers[0];
    const receiver = receivers[0];
    const amount = Math.min(payer.balance, receiver.balance);
    transfers.push({
      fromPlayerId: payer.playerId,
      fromPlayerName: payer.playerName,
      toPlayerId: receiver.playerId,
      toPlayerName: receiver.playerName,
      amount,
    });
    payer.balance -= amount;
    receiver.balance -= amount;
    if (payer.balance === 0) payers.shift();
    if (receiver.balance === 0) receivers.shift();
  }

  return {
    totals: participants.map((player, index) => ({
      playerId: player.id,
      playerName: player.name,
      points: totals[index],
      target: targets[index],
    })),
    transfers,
  };
}
