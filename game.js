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
};

const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d');

let animationId = null;
let lastTime = 0;

const state = {
  running: false,
  amy: {
    x: 180,
    y: 500,
    radius: 22,
    speed: 260,
  },
  keys: new Set(),
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
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  showScreen(screens.menu);
}

function update(delta) {
  const amy = state.amy;
  const movement = amy.speed * delta;

  if (state.keys.has('ArrowLeft') || state.keys.has('a')) amy.x -= movement;
  if (state.keys.has('ArrowRight') || state.keys.has('d')) amy.x += movement;
  if (state.keys.has('ArrowUp') || state.keys.has('w')) amy.y -= movement;
  if (state.keys.has('ArrowDown') || state.keys.has('s')) amy.y += movement;

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

  ctx.save();
  ctx.shadowColor = 'rgba(182, 92, 255, 0.75)';
  ctx.shadowBlur = 28;

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
  ctx.fillText('Bewege Amy mit WASD oder den Pfeiltasten.', 28, window.innerHeight - 34);
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

buttons.start.addEventListener('click', startGame);
buttons.settings.addEventListener('click', () => showScreen(screens.settings));
buttons.settingsBack.addEventListener('click', () => showScreen(screens.menu));
buttons.backToMenu.addEventListener('click', stopGame);
buttons.exit.addEventListener('click', () => {
  alert('Im Browser kann ein Spiel die Seite nicht zuverlässig schließen. Amy wartet im Schatten weiter ...');
});

window.addEventListener('resize', () => {
  resizeCanvas();
  createParticles();
});

window.addEventListener('keydown', (event) => {
  state.keys.add(event.key.toLowerCase());
});

window.addEventListener('keyup', (event) => {
  state.keys.delete(event.key.toLowerCase());
});
