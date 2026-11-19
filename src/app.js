import {
  calculateScore,
  calculateSettlement,
  DEFAULT_RULES,
  EMPTY_COUNTS,
} from "./score.js";

const STORAGE_KEY = "gostop-scoreboard-v1";
const standaloneOfflineFile = document.documentElement.hasAttribute("data-standalone-offline");
const DEFAULT_PLAYERS = [
  { id: "player-1", name: "1번", total: 0, entries: [], counts: { ...EMPTY_COUNTS } },
  { id: "player-2", name: "2번", total: 0, entries: [], counts: { ...EMPTY_COUNTS } },
];
const CATEGORY_INFO = [
  { key: "gwang", label: "광", note: "3광 3점 · 4광 4점 · 5광 15점", max: 5 },
  { key: "animals", label: "열끗", note: "5장부터 1점, 이후 한 장마다 +1", max: 9 },
  { key: "ribbons", label: "띠", note: "5장부터 1점, 이후 한 장마다 +1", max: 10 },
  { key: "pi", label: "피", note: "10장부터 1점, 쌍피는 2장으로 계산", max: 24 },
  { key: "doublePi", label: "쌍피", note: "2장으로 계산", max: 12 },
  { key: "go", label: "고", note: "3고부터 ×2", max: 12 },
];

function createInitialState() {
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

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
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

const loaded = loadState();
let state = loaded.state;
let storageNotice = loaded.notice;
const app = document.querySelector("#app");

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageNotice = "";
  } catch {
    storageNotice = "자동 저장을 사용할 수 없습니다. 이 화면을 닫기 전에 기록을 확인해 주세요.";
  }
  renderNotice();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[character];
  });
}

function normalizedCount(value, max) {
  const number = Number(value);
  const count = Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  return max ? Math.min(max, count) : count;
}

function isEmptyCounts(counts) {
  return Object.values(counts).every((count) => count === 0);
}

function countInput(player, category) {
  const count = player.counts[category.key];
  return `
    <label class="count-row">
      <span class="count-copy">
        <span class="count-label">${category.label}</span>
        <span class="count-note">${category.note}</span>
      </span>
      <span class="count-control">
        <button class="step-button" type="button" data-step="-1" data-count="${category.key}" data-player-id="${player.id}" aria-label="${escapeHtml(player.name)} ${category.label} 한 장 줄이기">−</button>
        <input class="count-input" type="number" min="0" max="${category.max}" step="1" inputmode="numeric" data-count="${category.key}" data-player-id="${player.id}" aria-label="${escapeHtml(player.name)} ${category.label} 장수" value="${count}" />
        <button class="step-button" type="button" data-step="1" data-count="${category.key}" data-player-id="${player.id}" aria-label="${escapeHtml(player.name)} ${category.label} 한 장 늘리기">+</button>
      </span>
    </label>`;
}

function renderStandings() {
  return state.players
    .map(
      (player, index) => `
        <div class="standing-row">
          <span class="standing-rank">${String(index + 1).padStart(2, "0")}</span>
          <span class="standing-name">${escapeHtml(player.name || `${index + 1}번`)}</span>
          <span class="standing-total">${player.total.toLocaleString("ko-KR")}<small>점</small></span>
        </div>`,
    )
    .join("");
}

function renderPlayer(player, index) {
  const result = calculateScore(player.counts, state.rules);
  const effectivePi = player.counts.pi + player.counts.doublePi * 2;
  const math = [
    ["광", result.categoryPoints.gwang],
    ["열끗", result.categoryPoints.animals],
    ["띠", result.categoryPoints.ribbons],
    ["피", result.categoryPoints.pi],
  ]
    .map(
      ([label, amount]) =>
        `<div class="math-row"><span>${label}</span><strong>${amount ? `${amount}점` : "—"}</strong></div>`,
    )
    .join("");
  const multipliers = [];
  if (result.goMultiplier > 1) multipliers.push(`${player.counts.go}고 ×${result.goMultiplier}`);
  if (result.meongTtaMultiplier > 1) multipliers.push("멍따 ×2");
  const multiplierFormula = [result.goMultiplier, result.meongTtaMultiplier]
    .filter((multiplier) => multiplier > 1)
    .map((multiplier) => `×${multiplier}`)
    .join(" ");
  const equation = multiplierFormula
    ? `${result.basePoints}점 ${multiplierFormula} = ${result.total}점`
    : `${result.basePoints}점`;

  return `
    <article class="player-entry" data-player-card="${player.id}">
      <header class="player-entry-heading">
        <span class="player-number">${String(index + 1).padStart(2, "0")}</span>
        <label class="player-entry-name">
          <span class="sr-only">플레이어 ${index + 1} 이름</span>
          <input data-player-name="${player.id}" value="${escapeHtml(player.name)}" maxlength="12" aria-label="플레이어 ${index + 1} 이름" />
        </label>
        <span class="running-total"><strong>${player.total.toLocaleString("ko-KR")}</strong>점</span>
        <button class="remove-player-button" type="button" data-action="remove-player" data-player-id="${player.id}" aria-label="${escapeHtml(player.name)} 플레이어 삭제" ${state.players.length <= 2 ? "disabled" : ""}>삭제</button>
      </header>

      <div class="player-score-content">
        <section class="player-counts" aria-label="${escapeHtml(player.name)} 카드 입력">
          <div class="count-groups">
            <section class="count-group">
              <div class="group-title"><span class="shape-mark mark-gwang" aria-hidden="true"></span><h3>광</h3></div>
              ${countInput(player, CATEGORY_INFO[0])}
              <p class="group-footnote" data-gwang-note ${player.counts.gwang === 3 && state.rules.threeGwangWithBiIsTwo ? "" : "hidden"}>${player.counts.gwang === 3 && state.rules.threeGwangWithBiIsTwo ? "비광 포함 3광은 2점" : ""}</p>
            </section>
            <section class="count-group">
              <div class="group-title"><span class="shape-mark mark-animal" aria-hidden="true"></span><h3>열끗 · 멍따</h3></div>
              ${countInput(player, CATEGORY_INFO[1])}
              <p class="group-footnote">7장부터 멍따 배수 적용 여부는 아래 규칙에서 선택</p>
            </section>
            <section class="count-group">
              <div class="group-title"><span class="shape-mark mark-ribbon" aria-hidden="true"></span><h3>띠</h3></div>
              ${countInput(player, CATEGORY_INFO[2])}
              <p class="group-footnote">띠 종류와 관계없이 장수로 계산</p>
            </section>
            <section class="count-group">
              <div class="group-title"><span class="shape-mark mark-pi" aria-hidden="true"></span><h3>피</h3></div>
              ${countInput(player, CATEGORY_INFO[3])}
              ${countInput(player, CATEGORY_INFO[4])}
              <p class="group-footnote" data-pi-total>현재 피 합계 <strong>${effectivePi}장</strong></p>
            </section>
          </div>
          <div class="go-control">
            <div class="group-title"><span class="shape-mark mark-go" aria-hidden="true"></span><h3>고 횟수</h3></div>
            ${countInput(player, CATEGORY_INFO[5])}
          </div>
        </section>

        <aside class="player-result" aria-label="${escapeHtml(player.name)} 실시간 계산">
          <div class="player-result-topline"><span class="live-dot" aria-hidden="true"></span>이번 판 점수</div>
          <div class="player-result-main">
            <strong class="player-round-score" aria-live="polite" aria-atomic="true">${result.total.toLocaleString("ko-KR")}</strong>
            <span>점</span>
            <small class="player-equation">${equation}</small>
          </div>
          <div class="math-breakdown">${math}</div>
          <div class="multiplier-line"><span>적용 배수</span><strong>${multipliers.join(" · ") || "배수 없음"}</strong></div>
          <div class="player-actions">
              <button class="clear-player-button" type="button" data-action="clear-entry" data-player-id="${player.id}" ${isEmptyCounts(player.counts) ? "disabled" : ""}>입력 지우기</button>
          </div>
        </aside>
      </div>
    </article>`;
}

function renderRoundHistory() {
  const entries = state.players.flatMap((player) =>
    player.entries.map((entry) => ({
      playerName: entry.playerName || player.name,
      entry,
    })),
  );
  entries.sort(
    (left, right) =>
      (Date.parse(right.entry.recordedAt ?? "") || 0) -
        (Date.parse(left.entry.recordedAt ?? "") || 0) ||
      (right.entry.roundNumber ?? 0) - (left.entry.roundNumber ?? 0),
  );

  if (entries.length === 0) {
    return '<p class="history-empty">아직 기록된 판이 없어요.</p>';
  }

  return entries
    .map(({ playerName, entry }) => {
      const breakdown = entry.breakdown;
      const categoryRows = breakdown?.categoryPoints
        ? [
            ["광", breakdown.categoryPoints.gwang],
            ["열끗", breakdown.categoryPoints.animals],
            ["띠", breakdown.categoryPoints.ribbons],
            ["피", breakdown.categoryPoints.pi],
          ]
            .map(
              ([label, points]) =>
                `<span>${label}<strong>${Number(points) || 0}점</strong></span>`,
            )
            .join("")
        : '<p class="history-detail-unavailable">이전 기록에는 세부 점수 계산이 저장되어 있지 않습니다.</p>';
      const formula = breakdown
        ? `${breakdown.basePoints}점${breakdown.goMultiplier > 1 ? ` ×${breakdown.goMultiplier} (고)` : ""}${breakdown.meongTtaMultiplier > 1 ? ` ×${breakdown.meongTtaMultiplier} (멍따)` : ""} = ${breakdown.total}점`
        : "";
      const ruleNotes = [];
      if (entry.counts?.gwang === 3 && entry.rules?.threeGwangWithBiIsTwo) {
        ruleNotes.push("비광 포함 3광 2점 규칙");
      }
      const counts = entry.counts
        ? [
            ["광", entry.counts.gwang],
            ["열끗", entry.counts.animals],
            ["띠", entry.counts.ribbons],
            ["피", entry.counts.pi + entry.counts.doublePi * 2],
            ["고", entry.counts.go],
          ]
            .filter(([, count]) => count > 0)
            .map(([label, count]) => `${label} ${count}`)
            .join(" · ") || "획득 점수 없음"
        : entry.description || "점수 기록";
      const date = entry.recordedAt ? new Date(entry.recordedAt) : null;
      const recordedDate =
        date && !Number.isNaN(date.getTime())
          ? date.toLocaleString("ko-KR", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

      return `
        <details class="history-row">
          <summary class="history-summary">
            <span class="history-round">${entry.roundNumber ? `${entry.roundNumber}판` : "기록"}</span>
            <span class="history-player">${escapeHtml(playerName)}</span>
            <span class="history-description">${escapeHtml(counts)}</span>
            <strong class="history-points">${entry.amount > 0 ? "+" : ""}${entry.amount.toLocaleString("ko-KR")}점</strong>
          </summary>
          <div class="history-detail">
            <div class="history-detail-heading">
              <strong>${escapeHtml(playerName)} · ${entry.roundNumber ? `${entry.roundNumber}판 점수` : "점수 기록"}</strong>
              ${recordedDate ? `<time datetime="${escapeHtml(date.toISOString())}">${escapeHtml(recordedDate)}</time>` : ""}
            </div>
            <div class="history-breakdown">${categoryRows}</div>
            ${formula ? `<p class="history-formula">계산 <strong>${escapeHtml(formula)}</strong></p>` : ""}
            <p class="history-counts">입력 패 <span>${escapeHtml(counts)}</span></p>
            ${ruleNotes.length ? `<p class="history-rule-notes">적용 규칙 ${escapeHtml(ruleNotes.join(" · "))}</p>` : ""}
          </div>
        </details>`;
    })
    .join("");
}

function renderSettlement() {
  const latest = state.settlements.at(-1);
  if (!latest) return "";

  const transfers =
    latest.transfers.length === 0
      ? '<p class="settlement-even">이번 5판은 점수가 같아 주고받을 점수가 없습니다.</p>'
      : latest.transfers
          .map(
            (transfer) => `
              <div class="settlement-transfer">
                <span>${escapeHtml(transfer.fromPlayerName)} <b>→</b> ${escapeHtml(transfer.toPlayerName)}</span>
                <strong>${transfer.amount.toLocaleString("ko-KR")}점</strong>
              </div>`,
          )
          .join("");
  const totals = latest.totals
    .map(
      (player) =>
        `<span>${escapeHtml(player.playerName)} <strong>${player.points.toLocaleString("ko-KR")}점</strong></span>`,
    )
    .join("");

  return `
    <section class="settlement-result" aria-labelledby="settlement-title">
      <div class="settlement-heading">
        <div><h2 id="settlement-title">${latest.fromRound}–${latest.throughRound}판 정산</h2><p>5판 점수 합계를 인원수에 맞춰 균등 정산합니다.</p></div>
        <span class="settlement-stamp">정산 완료</span>
      </div>
      <div class="settlement-totals">${totals}</div>
      <div class="settlement-transfers">${transfers}</div>
      <p class="settlement-note">정산은 점수 단위입니다. 금액으로 환산할 때는 모임의 점당 금액을 적용하세요.</p>
    </section>`;
}

function renderRules() {
  return `
    <details class="rules">
      <summary><span>점수 기준과 규칙 선택</span><span class="rule-default">모임 규칙에 맞게 변경</span></summary>
      <div class="rule-list">
        <label class="rule-toggle">
          <input type="checkbox" data-rule="threeGwangWithBiIsTwo" ${state.rules.threeGwangWithBiIsTwo ? "checked" : ""} />
          <span><strong>비광 포함 3광은 2점</strong><small>끄면 3광 3점으로 계산합니다.</small></span>
        </label>
        <label class="rule-toggle">
          <input type="checkbox" data-rule="meongTta" ${state.rules.meongTta ? "checked" : ""} />
          <span><strong>열끗 7장부터 멍따 ×2</strong><small>다른 배수와 곱해서 적용합니다.</small></span>
        </label>
        <label class="rule-toggle">
          <input type="checkbox" data-rule="goMultiplier" ${state.rules.goMultiplier ? "checked" : ""} />
          <span><strong>3고부터 두 배씩</strong><small>3고 ×2, 4고 ×4, 5고 ×8 기준입니다.</small></span>
        </label>
        <p class="rule-disclaimer">고스톱 점수는 모임마다 다를 수 있어요. 박·흔들기·피박·광박과 점당 환산은 이 계산에 포함되지 않습니다.</p>
      </div>
    </details>`;
}

function renderNotice() {
  const notice = document.querySelector("#app-notice");
  if (!notice) return;
  const message = storageNotice || loaded.notice;
  notice.textContent = message;
  notice.hidden = !message;
}

function render() {
  app.innerHTML = `
    <div class="felt">
      <header class="masthead">
        <a class="brand" href="./" aria-label="고스톱 점수판 홈">
          <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>고스톱 <strong>점수판</strong></span>
        </a>
        <a class="masthead-note" href="#install-guide">${standaloneOfflineFile ? "Chrome 오프라인 파일" : "iPad 홈 화면 설치"}</a>
      </header>

      <div id="app-notice" class="notice" role="status" hidden></div>

      <section class="scoreboard" aria-labelledby="scoreboard-title">
        <div class="section-heading">
          <div>
            <h1 id="scoreboard-title">오늘의 판</h1>
            <p>플레이어별 패를 입력하고 점수를 바로 기록하세요.</p>
          </div>
          <div class="game-controls">
            <a class="text-button history-jump" href="#history-title">점수 로그 보기</a>
            <button class="text-button" type="button" data-action="add-player" ${state.players.length >= 4 ? "disabled" : ""}>＋ 플레이어 추가</button>
          </div>
        </div>
        <div class="standings" aria-label="플레이어별 누적 점수">${renderStandings()}</div>
      </section>

      <main>
        <div class="players-heading">
          <div><h2>플레이어별 이번 판 입력</h2><p>각자 패 수를 입력한 뒤 한 번에 판을 마감하세요.</p></div>
          <span>${state.players.length}명</span>
        </div>
        <div class="player-entry-list">${state.players.map(renderPlayer).join("")}</div>
        <section class="round-commit" aria-label="이번 판 마감">
          <div class="round-commit-copy">
            <span class="round-commit-count">다음 정산까지 <strong>${state.completedRounds.length % 5}/5판</strong></span>
            <p>모든 플레이어의 이번 점수를 함께 기록합니다. 5판마다 자동으로 점수를 정산합니다.</p>
          </div>
          <button class="record-round-button" type="button" data-action="record-round" ${state.players.every((player) => calculateScore(player.counts, state.rules).total === 0) ? "disabled" : ""}>이번 판 기록하기 <span aria-hidden="true">→</span></button>
        </section>
        ${renderSettlement()}
        ${renderRules()}
      </main>

      <section class="round-history" aria-labelledby="history-title">
        <div class="history-heading">
          <div><h2 id="history-title" tabindex="-1">점수 기록 로그</h2><p>기록을 눌러 판별 점수와 계산 내역을 확인하세요.</p></div>
          <span class="history-count">${state.players.reduce((sum, player) => sum + player.entries.length, 0)}건 전체</span>
          <button class="text-button" type="button" data-action="undo" ${state.completedRounds.length || state.undoStack.length ? "" : "disabled"}>↶ 마지막 판 되돌리기</button>
        </div>
        <div class="history-list">${renderRoundHistory()}</div>
      </section>

      <footer class="page-footer">
        <p>모임의 규칙에 맞춰 선택하세요. 이 점수판은 패 점수만 계산합니다.</p>
        <button class="reset-button" type="button" data-action="reset">게임 전체 초기화</button>
      </footer>
      <details class="install-guide" id="install-guide">
        <summary>${standaloneOfflineFile ? "iPad Chrome에서 오프라인 파일 사용" : "iPad 홈 화면에 추가하고 오프라인으로 사용하기"}</summary>
        ${
          standaloneOfflineFile
            ? `<ol>
                <li>이 단일 HTML 파일을 iPad의 파일 앱에 저장한 뒤 공유 메뉴에서 Chrome으로 엽니다. 미리보기가 열리면 공유 메뉴에서 Chrome으로 보내세요.</li>
                <li>점수는 Chrome 저장 공간에 자동 기록됩니다. 같은 파일을 같은 위치에서 열고, 시크릿 모드나 브라우저 데이터 삭제는 피하세요.</li>
              </ol>
              <p>브라우저가 로컬 파일 저장을 제한하면 기록이 다시 열 때 유지되지 않을 수 있습니다. 이 경우 HTTPS 주소로 앱을 한 번 열어 사용하세요. 다른 기기와는 동기화되지 않습니다.</p>`
            : `<ol>
                <li>인터넷에 연결한 상태로 이 앱의 <strong>HTTPS 주소</strong>를 엽니다. 홈 화면 설치는 파일 앱의 HTML 미리보기가 아니라 웹 주소에서 진행해야 합니다.</li>
                <li>브라우저의 공유 메뉴에서 <strong>홈 화면에 추가</strong>를 선택한 뒤 추가합니다.</li>
                <li>홈 화면의 고스톱 점수판 아이콘을 한 번 열어 앱을 준비하면, 이후에는 인터넷이 끊겨도 사용할 수 있습니다.</li>
              </ol>
              <p>점수와 기록은 이 iPad의 브라우저 저장 공간에 보관되며 다른 기기와 동기화되지 않습니다. 개인 정보 보호 브라우징에서는 기록이 보존되지 않을 수 있습니다.</p>`
        }
      </details>
    </div>
    <div class="table-edge" aria-hidden="true"></div>`;

  renderNotice();
}

function refreshPlayer(playerId) {
  const player = state.players.find((candidate) => candidate.id === playerId);
  const card = document.querySelector(`[data-player-card="${playerId}"]`);
  if (!player || !card) return;

  const result = calculateScore(player.counts, state.rules);
  const multipliers = [];
  if (result.goMultiplier > 1) multipliers.push(`${player.counts.go}고 ×${result.goMultiplier}`);
  if (result.meongTtaMultiplier > 1) multipliers.push("멍따 ×2");
  const multiplierFormula = [result.goMultiplier, result.meongTtaMultiplier]
    .filter((multiplier) => multiplier > 1)
    .map((multiplier) => `×${multiplier}`)
    .join(" ");
  const equation = multiplierFormula
    ? `${result.basePoints}점 ${multiplierFormula} = ${result.total}점`
    : `${result.basePoints}점`;

  card.querySelector(".player-round-score").textContent = result.total.toLocaleString("ko-KR");
  card.querySelector(".player-equation").textContent = equation;
  card.querySelector(".math-breakdown").innerHTML = [
    ["광", result.categoryPoints.gwang],
    ["열끗", result.categoryPoints.animals],
    ["띠", result.categoryPoints.ribbons],
    ["피", result.categoryPoints.pi],
  ]
    .map(
      ([label, amount]) =>
        `<div class="math-row"><span>${label}</span><strong>${amount ? `${amount}점` : "—"}</strong></div>`,
    )
    .join("");
  card.querySelector(".multiplier-line strong").textContent = multipliers.join(" · ") || "배수 없음";
  card.querySelector(".clear-player-button").disabled = isEmptyCounts(player.counts);
  const gwangNote = card.querySelector("[data-gwang-note]");
  const hasThreeGwangVariant = player.counts.gwang === 3 && state.rules.threeGwangWithBiIsTwo;
  gwangNote.hidden = !hasThreeGwangVariant;
  gwangNote.textContent = hasThreeGwangVariant ? "비광 포함 3광은 2점" : "";
  card.querySelector("[data-pi-total]").innerHTML =
    `현재 피 합계 <strong>${player.counts.pi + player.counts.doublePi * 2}장</strong>`;
  card.querySelectorAll("[data-count]").forEach((input) => {
    if (document.activeElement !== input) input.value = player.counts[input.dataset.count];
  });
}

function updateStandings() {
  const rows = [...document.querySelectorAll(".standing-row")];
  rows.forEach((row, index) => {
    const player = state.players[index];
    if (!player) return;
    row.querySelector(".standing-name").textContent = player.name || `${index + 1}번`;
    row.querySelector(".standing-total").innerHTML = `${player.total.toLocaleString("ko-KR")}<small>점</small>`;
  });
}

function persistAndUpdate(playerId) {
  saveState();
  if (playerId) refreshPlayer(playerId);
  updateStandings();
  updateRoundControls();
}

function updateRoundControls() {
  const button = document.querySelector('[data-action="record-round"]');
  if (!button) return;
  button.disabled = state.players.every(
    (player) => calculateScore(player.counts, state.rules).total === 0,
  );
}

function describeEntry(counts, result) {
  const categories = [];
  if (counts.gwang) categories.push(`광 ${counts.gwang}`);
  if (counts.animals) categories.push(`열끗 ${counts.animals}`);
  if (counts.ribbons) categories.push(`띠 ${counts.ribbons}`);
  if (counts.pi || counts.doublePi) categories.push(`피 ${counts.pi + counts.doublePi * 2}`);
  if (counts.go) categories.push(`${counts.go}고`);
  const multipliers = [];
  if (result.goMultiplier > 1) multipliers.push(`고×${result.goMultiplier}`);
  if (result.meongTtaMultiplier > 1) multipliers.push("멍따×2");
  return `${categories.join(" · ")}${multipliers.length ? ` / ${multipliers.join(" · ")}` : ""}`;
}

function handleAction(button) {
  const kind = button.dataset.action;
  const player = state.players.find((candidate) => candidate.id === button.dataset.playerId);

  if (kind === "add-player") {
    if (state.players.length >= 4) return;
    const newPlayer = {
      id: `player-${crypto.randomUUID()}`,
      name: `${state.players.length + 1}번`,
      total: 0,
      entries: [],
      counts: { ...EMPTY_COUNTS },
    };
    state.players.push(newPlayer);
    saveState();
    render();
    document.querySelector(`[data-player-name="${newPlayer.id}"]`)?.focus();
    return;
  }

  if (kind === "remove-player") {
    if (!player || state.players.length <= 2) return;
    if (!window.confirm(`${player.name} 플레이어와 누적 점수·기록을 삭제할까요?`)) return;
    state.players = state.players.filter((candidate) => candidate.id !== player.id);
    state.undoStack = state.undoStack.filter((entry) => entry.playerId !== player.id);
    saveState();
    render();
    return;
  }

  if (kind === "clear-entry") {
    if (!player || isEmptyCounts(player.counts)) return;
    if (!window.confirm(`${player.name}의 이번 판 입력을 지울까요? 기록된 점수는 그대로 남습니다.`)) return;
    player.counts = { ...EMPTY_COUNTS };
    saveState();
    render();
    return;
  }

  if (kind === "record-round") {
    const scores = state.players.map((participant) => ({
      playerId: participant.id,
      playerName: participant.name,
      amount: calculateScore(participant.counts, state.rules).total,
    }));
    if (scores.every((score) => score.amount === 0)) return;

    const roundNumber = state.completedRounds.length + 1;
    const roundId = crypto.randomUUID();
    const previousCounts = Object.fromEntries(
      state.players.map((participant) => [participant.id, { ...participant.counts }]),
    );
    const recordedAt = new Date().toISOString();
    state.players.forEach((participant) => {
      const result = calculateScore(participant.counts, state.rules);
      const amount = scores.find((score) => score.playerId === participant.id).amount;
      participant.total += amount;
      participant.entries.push({
        id: crypto.randomUUID(),
        roundId,
        roundNumber,
        playerName: participant.name,
        amount,
        description: describeEntry(participant.counts, result) || "획득 점수 없음",
        breakdown: result,
        counts: { ...participant.counts },
        rules: { ...state.rules },
        recordedAt,
      });
      participant.counts = { ...EMPTY_COUNTS };
    });
    state.completedRounds.push({ id: roundId, roundNumber, scores, previousCounts, recordedAt });

    if (roundNumber % 5 === 0) {
      const settlementRounds = state.completedRounds.slice(-5);
      state.settlements.push({
        id: crypto.randomUUID(),
        fromRound: roundNumber - 4,
        throughRound: roundNumber,
        createdAt: recordedAt,
        ...calculateSettlement(state.players, settlementRounds),
      });
    }
    saveState();
    render();
    document.querySelector("#history-title").focus({ preventScroll: true });
    return;
  }

  if (kind === "undo") {
    const previousRound = state.completedRounds.pop();
    if (previousRound) {
      state.players.forEach((participant) => {
        const entryIndex = participant.entries.findIndex(
          (entry) => entry.roundId === previousRound.id,
        );
        if (entryIndex !== -1) {
          const [entry] = participant.entries.splice(entryIndex, 1);
          participant.total = Math.max(0, participant.total - entry.amount);
        }
        if (isEmptyCounts(participant.counts) && previousRound.previousCounts[participant.id]) {
          participant.counts = previousRound.previousCounts[participant.id];
        }
      });
      state.settlements = state.settlements.filter(
        (settlement) => settlement.throughRound <= state.completedRounds.length,
      );
    } else {
      const previous = state.undoStack.pop();
      if (!previous) return;
      const owner = state.players.find((candidate) => candidate.id === previous.playerId);
      if (owner) {
        const entryIndex = owner.entries.findIndex((entry) => entry.id === previous.entryId);
        if (entryIndex !== -1) {
          const [entry] = owner.entries.splice(entryIndex, 1);
          owner.total = Math.max(0, owner.total - entry.amount);
          if (isEmptyCounts(owner.counts) && previous.previousCounts) {
            owner.counts = previous.previousCounts;
          }
        }
      }
    }
    saveState();
    render();
    return;
  }

  if (kind === "reset") {
    if (!window.confirm("모든 플레이어, 누적 점수, 판 기록을 지우고 새 게임을 시작할까요? 이 작업은 되돌릴 수 없습니다.")) return;
    state = createInitialState();
    saveState();
    render();
  }
}

function maximumForCount(key) {
  return CATEGORY_INFO.find((category) => category.key === key)?.max ?? 12;
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.step) {
    const { count: key, playerId } = button.dataset;
    const input = document.querySelector(
      `[data-count="${key}"][data-player-id="${playerId}"]`,
    );
    const player = state.players.find((candidate) => candidate.id === playerId);
    if (!input || !player) return;
    player.counts[key] = normalizedCount(
      player.counts[key] + Number(button.dataset.step),
      maximumForCount(key),
    );
    input.value = player.counts[key];
    persistAndUpdate(playerId);
    return;
  }

  handleAction(button);
});

app.addEventListener("input", (event) => {
  const input = event.target;
  if (input.matches("[data-count]")) {
    const player = state.players.find((candidate) => candidate.id === input.dataset.playerId);
    if (!player) return;
    player.counts[input.dataset.count] = normalizedCount(
      input.value,
      maximumForCount(input.dataset.count),
    );
    if (input.value !== "" && input.value !== String(player.counts[input.dataset.count])) {
      input.value = String(player.counts[input.dataset.count]);
    }
    input.setAttribute("aria-valuetext", `${player.counts[input.dataset.count]}장`);
    persistAndUpdate(player.id);
    return;
  }

  if (input.matches("[data-rule]")) {
    state.rules[input.dataset.rule] = input.checked;
    saveState();
    state.players.forEach((player) => refreshPlayer(player.id));
    updateRoundControls();
    return;
  }

  if (input.matches("[data-player-name]")) {
    const player = state.players.find((candidate) => candidate.id === input.dataset.playerName);
    if (!player) return;
    player.name = input.value;
    const card = document.querySelector(`[data-player-card="${player.id}"]`);
    card
      .querySelector(".player-result")
      .setAttribute("aria-label", `${player.name || "플레이어"} 실시간 계산`);
    persistAndUpdate(player.id);
  }
});

app.addEventListener("change", (event) => {
  const input = event.target;
  if (!input.matches("[data-count]")) return;
  const player = state.players.find((candidate) => candidate.id === input.dataset.playerId);
  if (!player) return;
  player.counts[input.dataset.count] = normalizedCount(
    input.value,
    maximumForCount(input.dataset.count),
  );
  input.value = player.counts[input.dataset.count];
  persistAndUpdate(player.id);
});

render();

if (!standaloneOfflineFile && location.protocol !== "file:") {
  if (!window.isSecureContext || !("serviceWorker" in navigator)) {
    storageNotice = "홈 화면 설치와 오프라인 사용은 HTTPS를 지원하는 주소에서 사용할 수 있습니다.";
    renderNotice();
  } else {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => navigator.serviceWorker.ready)
      .catch((error) => {
        console.error("오프라인 앱 준비에 실패했습니다.", error);
        storageNotice = "오프라인 준비에 실패했어요. HTTPS 주소를 확인하고 다시 접속해 주세요.";
        renderNotice();
      });
  }
}
