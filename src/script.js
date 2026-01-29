const state = {
  playerCount: 3,
  spyCount: 1,
  timerMinutes: 5,
  names: [],
  locations: [],
  configKey: "spyGameConfig",
};

document.addEventListener("DOMContentLoaded", () => {
  initSlider();
  initMenuPage();
  initGamePage();
});

function initSlider() {
  const slider = document.querySelector(".slider");
  const leftBtn = document.querySelector(".left");
  const rightBtn = document.querySelector(".right");

  if (!slider || !leftBtn || !rightBtn) return;

  const slideNumber = document.querySelectorAll(".slide").length;
  if (!slideNumber) return;

  const step = 100 / slideNumber;
  let translateX = 0;

  rightBtn.addEventListener("click", () => {
    if (translateX === -(100 - step)) return;
    translateX -= step;
    slider.style.transform = `translateX(${translateX}%)`;
  });

  leftBtn.addEventListener("click", () => {
    if (translateX === 0) return;
    translateX += step;
    slider.style.transform = `translateX(${translateX}%)`;
  });
}

function initMenuPage() {
  const menu = document.querySelector(".main-menu");
  if (!menu) return;

  const playersInput = document.querySelector('.number[data-type="players"]');
  const spiesInput = document.querySelector('.number[data-type="spy"]');
  const timerInput = document.querySelector('.number[data-type="timer"]');
  const startBtn = document.querySelector(".button-start-game");

  attachStepper(
    playersInput,
    '[data-type="buttonUpPlayers"]',
    '[data-type="buttonDownPlayers"]',
    3,
    12,
    (value) => {
      state.playerCount = value;
      clampSpyToPlayers(spiesInput);
    },
  );

  attachStepper(
    spiesInput,
    '[data-type="buttonUpSpy"]',
    '[data-type="buttonDownSpy"]',
    1,
    () => Math.max(1, state.playerCount - 1),
    (value) => {
      state.spyCount = value;
    },
  );

  attachStepper(
    timerInput,
    '[data-type="buttonUpSpyTimer"]',
    '[data-type="buttonDownTimer"]',
    3,
    40,
    (value) => {
      state.timerMinutes = value;
    },
  );

  loadLocations();

  if (startBtn) {
    startBtn.addEventListener("click", startGame);
  }

  window.openNameModal = () => {
    const modal = document.getElementById("nameModal");
    const nameInputs = document.getElementById("nameInputs");
    if (!modal || !nameInputs) return;

    nameInputs.innerHTML = "";

    for (let i = 1; i <= state.playerCount; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = `Гравець ${i}`;
      input.value = state.names[i - 1] || "";
      nameInputs.appendChild(input);
      nameInputs.appendChild(document.createElement("br"));
    }

    modal.style.display = "block";
  };

  window.closeNameModal = () => {
    const modal = document.getElementById("nameModal");
    if (modal) modal.style.display = "none";
  };

  window.saveNames = () => {
    const inputs = document.querySelectorAll("#nameInputs input");
    state.names = [];

    inputs.forEach((input, index) => {
      const value = (input.value || "").trim();
      state.names.push(value || `Гравець ${index + 1}`);
    });

    window.closeNameModal();
  };
}

function clampSpyToPlayers(spyInput) {
  if (!spyInput) return;
  const maxSpy = Math.max(1, state.playerCount - 1);
  if (state.spyCount > maxSpy) {
    state.spyCount = maxSpy;
    spyInput.value = maxSpy;
  }
}

function attachStepper(
  input,
  upSelector,
  downSelector,
  minValue,
  maxValue,
  onChange,
) {
  if (!input) return;

  const resolveMax = () =>
    typeof maxValue === "function" ? maxValue() : maxValue;
  const sync = (value) => {
    input.value = value;
    if (typeof onChange === "function") onChange(value);
  };

  const normalize = () => {
    const value = clampNumber(input.value, minValue, resolveMax());
    sync(value);
  };

  const upBtn = document.querySelector(upSelector);
  const downBtn = document.querySelector(downSelector);

  if (upBtn) {
    upBtn.addEventListener("click", () => {
      const next = clampNumber(Number(input.value) + 1, minValue, resolveMax());
      sync(next);
    });
  }

  if (downBtn) {
    downBtn.addEventListener("click", () => {
      const next = clampNumber(Number(input.value) - 1, minValue, resolveMax());
      sync(next);
    });
  }

  input.addEventListener("input", normalize);

  normalize();
}

async function startGame() {
  const players = clampNumber(state.playerCount, 3, 12);
  const spies = clampNumber(state.spyCount, 1, Math.max(1, players - 1));
  const minutes = clampNumber(state.timerMinutes, 3, 40);

  state.playerCount = players;
  state.spyCount = spies;
  state.timerMinutes = minutes;

  if (players <= spies) {
    alert("Кількість гравців має бути більшою за кількість шпигунів.");
    return;
  }

  const names = buildNames(players);
  const locations = await loadLocations();
  const location = locations.length
    ? pickRandom(locations)
    : {
        name: "Невідома локація",
        hint: "Додайте локації у файлі locations.json",
      };

  const spyIndexes = pickSpyIndexes(players, spies);
  const spiesNames = spyIndexes.map((index) => names[index]);

  const config = {
    players,
    spies,
    minutes,
    names,
    spyIndexes,
    spiesNames,
    location,
  };

  sessionStorage.setItem(state.configKey, JSON.stringify(config));
  window.location.href = "game.html";
}

function buildNames(count) {
  const result = [];
  for (let i = 0; i < count; i++) {
    const prepared = state.names[i] ? state.names[i].trim() : "";
    result.push(prepared || `Гравець ${i + 1}`);
  }
  return result;
}

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return min;
  const resolvedMax = typeof max === "function" ? max() : max;
  return Math.min(Math.max(numeric, min), resolvedMax);
}

function pickRandom(list) {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function pickSpyIndexes(players, spies) {
  const result = [];
  const used = new Set();

  while (result.length < spies) {
    const candidate = Math.floor(Math.random() * players);
    if (!used.has(candidate)) {
      used.add(candidate);
      result.push(candidate);
    }
  }
  return result;
}

async function loadLocations() {
  if (state.locations.length) return state.locations;
  try {
    const response = await fetch("locations.json");
    if (!response.ok)
      throw new Error(`Помилка завантаження (${response.status})`);
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.locations;
    state.locations = Array.isArray(list)
      ? list.filter((item) => item && item.name)
      : [];
  } catch (error) {
    console.error("Не вдалося завантажити локації", error);
    state.locations = [];
  }
  return state.locations;
}

function initGamePage() {
  const game = document.querySelector(".main-game");
  if (!game || !document.body.classList.contains("game-page")) return;

  const configRaw = sessionStorage.getItem(state.configKey);
  if (!configRaw) {
    window.location.href = "menu.html";
    return;
  }

  let config;
  try {
    config = JSON.parse(configRaw);
  } catch (error) {
    console.error("Не вдалося прочитати налаштування гри", error);
    window.location.href = "menu.html";
    return;
  }

  const summary = document.getElementById("gameSummary");
  const prompt = document.getElementById("playerPrompt");
  const playerLabel = document.getElementById("playerLabel");
  const roleTitle = document.getElementById("roleTitle");
  const roleBody = document.getElementById("roleBody");
  const roleHelper = document.getElementById("roleHelper");
  const revealBtn = document.getElementById("revealBtn");
  const nextBtn = document.getElementById("nextPlayerBtn");
  const timerEl = document.querySelector(".timer");
  const spyReveal = document.getElementById("spyReveal");
  const backBtn = document.getElementById("backToMenuBtn");

  if (summary) {
    summary.textContent = `Гравців: ${config.players} · Шпигунів: ${config.spies} · Таймер: ${config.minutes} хв`;
  }

  if (timerEl) {
    timerEl.textContent = formatTime(config.minutes * 60);
  }

  let currentPlayer = 0;
  let timerStarted = false;

  function startRound() {
    if (timerStarted) return;
    timerStarted = true;
    if (revealBtn) revealBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;

    startCountdown(timerEl, config.minutes * 60, () => {
      if (!spyReveal) return;
      const spies =
        config.spiesNames && config.spiesNames.length
          ? config.spiesNames.join(", ")
          : "Невідомі";
      const message = `Шпигуни: ${spies}. Локація: ${config.location.name}.`;
      spyReveal.textContent = message;
      spyReveal.style.display = "block";
    });
  }

  const showPrompt = () => {
    const name = config.names[currentPlayer] || `Гравець ${currentPlayer + 1}`;
    if (prompt) prompt.textContent = `Передайте пристрій: ${name}`;
    if (playerLabel) playerLabel.textContent = name;
    if (roleTitle) roleTitle.textContent = "Твоя роль";
    if (roleBody) {
      roleBody.textContent =
        "Натисни «Показати роль», щоб дізнатися свої дані. Прикрий екран, щоб інші не підглядали.";
    }
    if (roleHelper)
      roleHelper.textContent =
        "Натисни «Показати роль», тримай у секреті від інших.";
    if (revealBtn) revealBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = true;
  };

  const revealRole = () => {
    const isSpy = config.spyIndexes.includes(currentPlayer);
    const name = config.names[currentPlayer] || `Гравець ${currentPlayer + 1}`;

    if (roleTitle) roleTitle.textContent = isSpy ? "Ти шпигун" : "Ти місцевий";
    if (roleBody) {
      if (isSpy) {
        roleBody.textContent = `${name}, твоя роль — шпигун. Слухай уважно і спробуй вгадати локацію.`;
      } else {
        const hint = config.location.hint ? `<br>${config.location.hint}` : "";
        roleBody.innerHTML = `${name}, локація: <strong>${config.location.name}</strong>.${hint}`;
      }
    }
    if (roleHelper)
      roleHelper.textContent =
        "Сховай картку, перш ніж передати пристрій далі.";

    if (revealBtn) revealBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = false;
  };

  const goNext = () => {
    currentPlayer += 1;

    if (currentPlayer >= config.players) {
      if (roleTitle) roleTitle.textContent = "Усі отримали ролі";
      if (roleBody)
        roleBody.textContent =
          "Таймер запущено автоматично. Починайте задавати питання!";
      if (roleHelper)
        roleHelper.textContent = "Таймер стартує автоматично. Успіхів!";
      if (revealBtn) revealBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      if (prompt)
        prompt.textContent = "Роздача ролей завершена, таймер запущено";
      startRound();
      return;
    }

    showPrompt();
  };

  if (revealBtn) revealBtn.addEventListener("click", revealRole);
  if (nextBtn) nextBtn.addEventListener("click", goNext);
  if (backBtn)
    backBtn.addEventListener("click", () => {
      window.location.href = "menu.html";
    });

  showPrompt();
}

function startCountdown(timerEl, totalSeconds, onFinished) {
  if (!timerEl) return null;
  let remain = totalSeconds;

  const render = () => {
    timerEl.textContent = formatTime(remain);
  };

  render();
  const id = setInterval(() => {
    remain -= 1;
    render();

    if (remain <= 0) {
      clearInterval(id);
      timerEl.textContent = formatTime(0);
      if (typeof onFinished === "function") onFinished();
    }
  }, 1000);

  return id;
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${pad2(minutes)} : ${pad2(sec)}`;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}
