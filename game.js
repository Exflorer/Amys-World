const screens = {
  menu: document.querySelector('#main-menu'),
  minigames: document.querySelector('#minigame-screen'),
  game: document.querySelector('#game-screen'),
  settings: document.querySelector('#settings-screen'),
};

const buttons = {
  start: document.querySelector('#start-game'),
  settings: document.querySelector('#open-settings'),
  settingsBack: document.querySelector('#settings-back'),
  backToMenu: document.querySelector('#back-to-menu'),
  minigamesBack: document.querySelector('#minigames-back'),
  carrot: document.querySelector('#carrot-button'),
  attack: document.querySelector('#attack-button'),
  dash: document.querySelector('#dash-button'),
};

const mrHops = document.querySelector('#mr-hops');
const bubble = document.querySelector('#hops-bubble');
const minigameHelper = document.querySelector('#minigame-helper-text');

let carrotGiven = false;
let dialogIndex = 0;

const dialogSteps = [
  'Karotte? 🐰🥕',
  'Danke! Jetzt bleibe ich kurz bei Amy und kuschle mich an.',
  'Tippe auf „Spielen“, dann zeige ich dir die Minispiele.',
  'Keine Eile. Du kannst mit dem Pfeil weiterklicken. ➜',
];

function showScreen(target) {
  Object.values(screens).forEach((screen) => screen?.classList.remove('screen-active'));
  target?.classList.add('screen-active');
}

function ensureNextButton() {
  if (!bubble || bubble.querySelector('#dialog-next')) return;
  const next = document.createElement('button');
  next.id = 'dialog-next';
  next.className = 'dialog-next';
  next.type = 'button';
  next.setAttribute('aria-label', 'Weiter');
  next.textContent = '➜';
  next.addEventListener('click', (event) => {
    event.stopPropagation();
    dialogIndex = Math.min(dialogIndex + 1, dialogSteps.length - 1);
    setBubble(dialogSteps[dialogIndex]);
  });
  bubble.appendChild(next);
}

function setBubble(text) {
  if (!bubble) return;
  bubble.innerHTML = `<span class="bubble-text">${text}</span>`;
  ensureNextButton();
}

function giveCarrot() {
  carrotGiven = true;
  dialogIndex = 1;
  buttons.carrot?.classList.add('used');
  if (buttons.carrot) buttons.carrot.disabled = true;
  setBubble(dialogSteps[dialogIndex]);
  mrHops?.classList.remove('on-arm');
  mrHops?.classList.add('free');
}

function openMinigames() {
  if (!carrotGiven) {
    setBubble('Erst eine Karotte bitte! Dann zeige ich dir die Spiele. 🐰🥕');
    return;
  }
  showScreen(screens.minigames);
  if (minigameHelper) minigameHelper.textContent = 'Da bist du! Such dir ein Portal aus. Einige sind erstmal Fake für den Roblox-Vibe ✨';
}

buttons.carrot?.addEventListener('click', giveCarrot);
buttons.start?.addEventListener('click', openMinigames);
buttons.settings?.addEventListener('click', () => showScreen(screens.settings));
buttons.settingsBack?.addEventListener('click', () => showScreen(screens.menu));
buttons.minigamesBack?.addEventListener('click', () => showScreen(screens.menu));
buttons.backToMenu?.addEventListener('click', () => showScreen(screens.menu));

document.querySelectorAll('.home-button[data-tip]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.id !== 'start-game') setBubble(button.dataset.tip || 'Hier passiert bald etwas Schönes!');
  });
});

document.querySelectorAll('.minigame-card').forEach((card) => {
  card.addEventListener('click', () => {
    const name = card.dataset.game || 'dieses Spiel';
    if (minigameHelper) minigameHelper.textContent = `„${name}“ ist vorbereitet. Dieses Portal ist erstmal Deko und wird später spielbar. 🐰`;
  });
});

const searchInput = document.querySelector('#fake-search-input');
searchInput?.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  document.querySelectorAll('.minigame-card').forEach((card) => {
    card.style.display = card.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
});

setBubble(dialogSteps[0]);
