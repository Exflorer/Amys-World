const screens = {
  menu: document.querySelector('#main-menu'),
  game: document.querySelector('#game-screen'),
  settings: document.querySelector('#settings-screen'),
};

const buttons = {
  start: document.querySelector('#start-game'),
  settings: document.querySelector('#open-settings'),
  exit: document.querySelector('#exit-game'),
  backToMenu: document.querySelector('#back-to-menu'),
  settingsBack: document.querySelector('#settings-back'),
  attack: document.querySelector('#attack-button'),
  dash: document.querySelector('#dash-button'),
};

const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d');
const joystick = document.querySelector('#joystick');
const joystickKnob = document.querySelector('#joystick-knob');

let animationId = null;
let lastTime = 0;
let attackFlashUntil = 0;
let dashUntil = 0;

const state = {
  running: false,
  amy: {
    x: 180,
    y: 500,
    radius: 22,
    speed: 260,
  },
  keys: new Set(),
  joystick: {
    active: false,
    pointerId: null,
    x: 0,
    y: 0,
  },
  particles: [],
};

function showScreen(target) {
  Object.values(screens).forEach((screen) => screen.classList.remove('screen-active'));
  target.classList.add('screen-active');
}

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function createParticles() {
  state.particles = Array.from({ length: 90 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 2.2 + 0.4,
    speed: Math.random() * 18 + 4,
    alpha: Math.random() * 0.5 + 0.15,
  }));
}

function startGame() {
  showScreen(screens.game);
  resizeCanvas();
  createParticles();
  state.running = true;
  lastTime = performance.now();
  animationId = requestAnimationFrame(gameLoop);
}

function stopGame() {
  state.running = false;
  resetJoystick();
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  showScreen(screens.menu);
}

function getKeyboardVector() {
  let x = 0;
  let y = 0;

  if (state.keys.has('arrowleft') || state.keys.has('a')) x -= 1;
  if (state.keys.has('arrowright') || state.keys.has('d')) x += 1;
  if (state.keys.has('arrowup') || state.keys.has('w')) y -= 1;
  if (state.keys.has('arrowdown') || state.keys.has('s')) y += 1;

  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

function getMoveVector() {
  const keyboard = getKeyboardVector();
  const hasKeyboardInput = keyboard.x !== 0 || keyboard.y !== 0;

  if (state.joystick.active || Math.hypot(state.joystick.x, state.joystick.y) > 0.05) {
    return { x: state.joystick.x, y: state.joystick.y };
  }

  return hasKeyboardInput ? keyboard : { x: 0, y: 0 };
}

function update(delta) {
  const amy = state.amy;
  const direction = getMoveVector();
  const dashBoost = performance.now() < dashUntil ? 2.2 : 1;
  const movement = amy.speed * dashBoost * delta;

  amy.x += direction.x * movement;
  amy.y += direction.y * movement;

  amy.x = Math.max(40, Math.min(window.innerWidth - 40, amy.x));
  amy.y = Math.max(100, Math.min(window.innerHeight - 40, amy.y));

  for (const particle of state.particles) {
    particle.y -= particle.speed * delta;
    particle.x += Math.sin(performance.now() / 1200 + particle.y) * 0.15;

    if (particle.y < -20) {
      particle.y = window.innerHeight + 20;
      particle.x = Math.random() * window.innerWidth;
    }
  }
}

function drawBackground() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#05050b');
  gradient.addColorStop(0.45, '#161027');
  gradient.addColorStop(1, '#030308');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(182, 92, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(width * 0.72, height * 0.25, 190, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(100, 221, 255, 0.06)';
  ctx.beginPath();
  ctx.arc(width * 0.25, height * 0.7, 240, 0, Math.PI * 2);
  ctx.fill();
}

function drawForestSilhouette() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  for (let i = 0; i < 18; i += 1) {
    const x = (i / 17) * width;
    const treeHeight = 120 + (i % 5) * 28;
    ctx.beginPath();
    ctx.moveTo(x - 48, height);
    ctx.lineTo(x, height - treeHeight);
    ctx.lineTo(x + 48, height);
    ctx.closePath();
    ctx.fill();
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.fillStyle = `rgba(210, 230, 255, ${particle.alpha})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAmy() {
  const amy = state.amy;
  const now = performance.now();

  if (now < attackFlashUntil) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 79, 139, 0.78)';
    ctx.lineWidth = 5;
    ctx.shadowColor = 'rgba(255, 79, 139, 0.9)';
    ctx.shadowBlur = 28;
    ctx.beginPath();
    ctx.arc(amy.x, amy.y, 52, -0.65, 0.95);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = now < dashUntil ? 'rgba(100, 221, 255, 0.95)' : 'rgba(182, 92, 255, 0.75)';
  ctx.shadowBlur = now < dashUntil ? 42 : 28;

  ctx.fillStyle = '#f6efff';
  ctx.beginPath();
  ctx.arc(amy.x, amy.y, amy.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#b65cff';
  ctx.beginPath();
  ctx.arc(amy.x + 8, amy.y - 5, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.fillStyle = 'rgba(246, 239, 255, 0.82)';
  ctx.font = '16px system-ui';
  ctx.fillText('Amy', amy.x - 16, amy.y - 34);
}

function drawHint() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.76)';
  ctx.font = '18px system-ui';
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const text = isTouch
    ? 'Steuere Amy mit dem linken Joystick. Rechts: Angriff und Ausweichen.'
    : 'Bewege Amy mit WASD oder den Pfeiltasten. Angriff: Leertaste. Dash: Shift.';
  ctx.fillText(text, 28, window.innerHeight - 34);
}

function render() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawBackground();
  drawForestSilhouette();
  drawParticles();
  drawAmy();
  drawHint();
}

function gameLoop(now) {
  if (!state.running) return;

  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  update(delta);
  render();

  animationId = requestAnimationFrame(gameLoop);
}

function resetJoystick() {
  state.joystick.active = false;
  state.joystick.pointerId = null;
  state.joystick.x = 0;
  state.joystick.y = 0;
  joystickKnob.style.transform = 'translate(-50%, -50%)';
}

function updateJoystick(clientX, clientY) {
  const rect = joystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const maxDistance = rect.width / 2 - 24;
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const distance = Math.min(Math.hypot(dx, dy), maxDistance);
  const angle = Math.atan2(dy, dx);
  const knobX = Math.cos(angle) * distance;
  const knobY = Math.sin(angle) * distance;

  state.joystick.x = knobX / maxDistance;
  state.joystick.y = knobY / maxDistance;
  joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
}

function pulseButton(button) {
  button.classList.add('pressed');
  window.setTimeout(() => button.classList.remove('pressed'), 140);
}

function attack() {
  attackFlashUntil = performance.now() + 180;
  pulseButton(buttons.attack);
}

function dash() {
  dashUntil = performance.now() + 180;
  pulseButton(buttons.dash);
}

buttons.start.addEventListener('click', startGame);
buttons.settings.addEventListener('click', () => showScreen(screens.settings));
buttons.settingsBack.addEventListener('click', () => showScreen(screens.menu));
buttons.backToMenu.addEventListener('click', stopGame);
buttons.exit.addEventListener('click', () => {
  alert('Im Browser kann ein Spiel die Seite nicht zuverlässig schließen. Amy wartet im Schatten weiter ...');
});
buttons.attack.addEventListener('pointerdown', (event) => { event.preventDefault(); attack(); });
buttons.dash.addEventListener('pointerdown', (event) => { event.preventDefault(); dash(); });

joystick.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  joystick.setPointerCapture(event.pointerId);
  state.joystick.active = true;
  state.joystick.pointerId = event.pointerId;
  updateJoystick(event.clientX, event.clientY);
});

joystick.addEventListener('pointermove', (event) => {
  if (!state.joystick.active || state.joystick.pointerId !== event.pointerId) return;
  event.preventDefault();
  updateJoystick(event.clientX, event.clientY);
});

joystick.addEventListener('pointerup', resetJoystick);
joystick.addEventListener('pointercancel', resetJoystick);

window.addEventListener('resize', () => {
  resizeCanvas();
  createParticles();
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  state.keys.add(key);
  if (key === ' ') attack();
  if (key === 'shift') dash();
});

window.addEventListener('keyup', (event) => {
  state.keys.delete(event.key.toLowerCase());
});
