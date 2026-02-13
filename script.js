// Strella — simplified script
// Uses only assets/*.png as dashboard backgrounds and curated hotspots.

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const MAX_PREDICTION_CIRCLES = 5;
const PREDICTION_RADIUS = 112;
const PREDICTION_INTENSITY = 0.9;
const THEME_SWATCHES = ["#ad95d0", "#ff733a", "#83bbcd", "#ced255"];

// DOM
const prototypeCanvas = document.getElementById('prototype-canvas');
const predictionCanvas = document.getElementById('prediction-canvas');
const actualCanvas = document.getElementById('actual-canvas');
const prototypeCtx = prototypeCanvas.getContext('2d');
const predictionCtx = predictionCanvas.getContext('2d');
const actualCtx = actualCanvas.getContext('2d');

const dashboardScroll = document.getElementById('dashboard-scroll');
const clearBtn = document.getElementById('clear-btn');
const shareBtn = document.getElementById('share-btn');
const emailGateForm = document.getElementById('email-gate-form');
const workEmailInput = document.getElementById('work-email');
const startBtn = document.getElementById('start-btn');
const circleCounter = document.getElementById('circle-counter');
const resultMessage = document.getElementById('result-message');
const accuracyValue = document.getElementById('accuracy-value');
const overlapValue = document.getElementById('overlap-value');
const missValue = document.getElementById('miss-value');
const leaderboardEl = document.getElementById('leaderboard');
const nameForm = document.getElementById('name-form');
const playerNameInput = document.getElementById('player-name');
const leaderboardTemplate = document.getElementById('leaderboard-item-template');

let activeDashboardId = null;
let hasUnlockedPlay = false;
let predictedPoints = [];
let heatmapData = null;
let latestScore = null;
// track dashboards that have been played (persisted) and records
const PLAYED_KEY = 'defeat-the-heat-played-v1';
const PLAYED_RECORDS_KEY = 'defeat-the-heat-played-records-v1';
let playedDashboards = new Set();
let playedRecords = {};
try { playedDashboards = new Set(JSON.parse(localStorage.getItem(PLAYED_KEY) || '[]')); } catch (e) { playedDashboards = new Set(); }
try { playedRecords = JSON.parse(localStorage.getItem(PLAYED_RECORDS_KEY) || '{}'); } catch (e) { playedRecords = {}; }

function savePlayedDashboards() { try { localStorage.setItem(PLAYED_KEY, JSON.stringify(Array.from(playedDashboards))); } catch (e) { /* ignore */ } }
function savePlayedRecord(id, record) {
  if (!id) return;
  playedRecords[id] = record || null;
  try { localStorage.setItem(PLAYED_RECORDS_KEY, JSON.stringify(playedRecords)); } catch (e) { /* ignore */ }
}
function getPlayedRecord(id) { return playedRecords[id] || null; }

function markDashboardPlayed(id) {
  if (!id) return;
  playedDashboards.add(id);
  savePlayedDashboards();
  const card = document.querySelector(`.dashboard-preview[data-dashboard="${id}"]`);
  if (card) {
    card.classList.add('played');
  }
  // do not lock the board here — users can replay, we only mark it as played
}

// Assets list (explicit filenames in assets/)
const ASSETS = [
  'Boardto_Project Management Tool.png',
  'Bulletin_Shift Manager.png',
  'Crextio_Human Resources Management Platform.png',
  'Dashdark_Webpage Impressions Manager.png',
  'Dasyat_Project Manager.png',
  'Deep Fi_Crypto Exchange.png',
  'Healthcares_Longevity Health Tracker.png',
  'Mapa_Construction Planning Application.png',
  'Natal_Parental Health Service.png',
  'Neuro_Digital Product Marketplace.png',
  'Overcast_Social Financial Manager.png',
  'Peak_Business Health Manager.png',
  'Pie_Budgeting Platform.png',
  'Seer_Website Analytics Platform.png',
  'Space_Daily Task Manager.png',
  'Zuma_Wholistic Health Tracker.png'
];

// Curated hotspots per asset (chosen manually)
// Key is sanitized title: lowercase, non-alphanum -> hyphen
function idFromTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseFilename(fname) {
  const base = fname.replace(/\.[^.]+$/, '');
  const idx = base.indexOf('_');
  if (idx === -1) return { title: base, desc: '' };
  return { title: base.slice(0, idx), desc: base.slice(idx + 1).replace(/_/g, ' ') };
}

// Manually curated scenarios — mapped from assets above.
const DASHBOARD_SCENARIOS = {};
(function buildScenarios() {
  // For each asset we prepare a scenario object and curated points.
  // The points were chosen to represent likely interaction areas (header controls, nav, cards, CTAs).
  const manual = {
    boardto: [
      { x: 1100, y: 60, radius: 110, intensity: 0.9 },
      { x: 140, y: 200, radius: 100, intensity: 0.85 },
      { x: 600, y: 260, radius: 120, intensity: 0.95 },
      { x: 880, y: 380, radius: 110, intensity: 0.7 },
      { x: 980, y: 560, radius: 130, intensity: 0.65 }
    ],
    bulletin: [
      { x: 320, y: 120, radius: 100, intensity: 0.85 },
      { x: 120, y: 300, radius: 110, intensity: 0.9 },
      { x: 640, y: 320, radius: 130, intensity: 0.95 },
      { x: 980, y: 200, radius: 100, intensity: 0.7 },
      { x: 820, y: 520, radius: 120, intensity: 0.6 }
    ],
    crextio: [
      { x: 160, y: 140, radius: 100, intensity: 0.88 },
      { x: 520, y: 200, radius: 110, intensity: 0.9 },
      { x: 980, y: 160, radius: 100, intensity: 0.75 },
      { x: 900, y: 420, radius: 120, intensity: 0.65 },
      { x: 660, y: 520, radius: 110, intensity: 0.6 }
    ],
    dashdark: [
      { x: 320, y: 120, radius: 110, intensity: 0.9 },
      { x: 640, y: 320, radius: 140, intensity: 0.95 },
      { x: 980, y: 90, radius: 90, intensity: 0.7 },
      { x: 760, y: 420, radius: 120, intensity: 0.65 },
      { x: 540, y: 510, radius: 100, intensity: 0.6 }
    ],
    dasyat: [
      { x: 1100, y: 60, radius: 110, intensity: 0.9 },
      { x: 200, y: 220, radius: 100, intensity: 0.85 },
      { x: 620, y: 300, radius: 120, intensity: 0.95 },
      { x: 900, y: 420, radius: 110, intensity: 0.7 },
      { x: 480, y: 560, radius: 130, intensity: 0.65 }
    ],
    'deep-fi': [
      { x: 140, y: 260, radius: 110, intensity: 0.9 },
      { x: 640, y: 300, radius: 140, intensity: 0.95 },
      { x: 1060, y: 360, radius: 120, intensity: 0.9 },
      { x: 980, y: 60, radius: 90, intensity: 0.7 },
      { x: 320, y: 90, radius: 95, intensity: 0.6 }
    ],
    healthcares: [
      { x: 160, y: 200, radius: 110, intensity: 0.9 },
      { x: 620, y: 280, radius: 130, intensity: 0.95 },
      { x: 980, y: 140, radius: 95, intensity: 0.75 },
      { x: 760, y: 520, radius: 110, intensity: 0.65 },
      { x: 1100, y: 60, radius: 90, intensity: 0.6 }
    ],
    mapa: [
      { x: 640, y: 300, radius: 150, intensity: 0.95 },
      { x: 120, y: 160, radius: 100, intensity: 0.85 },
      { x: 980, y: 260, radius: 110, intensity: 0.8 },
      { x: 520, y: 420, radius: 120, intensity: 0.7 },
      { x: 880, y: 540, radius: 115, intensity: 0.6 }
    ],
    natal: [
      { x: 640, y: 200, radius: 120, intensity: 0.95 },
      { x: 300, y: 320, radius: 110, intensity: 0.85 },
      { x: 980, y: 120, radius: 100, intensity: 0.8 },
      { x: 500, y: 480, radius: 115, intensity: 0.7 },
      { x: 1080, y: 540, radius: 110, intensity: 0.6 }
    ],
    neuro: [
      { x: 640, y: 260, radius: 130, intensity: 0.95 },
      { x: 120, y: 220, radius: 110, intensity: 0.85 },
      { x: 980, y: 120, radius: 100, intensity: 0.8 },
      { x: 760, y: 380, radius: 115, intensity: 0.7 },
      { x: 540, y: 520, radius: 105, intensity: 0.6 }
    ],
    overcast: [
      { x: 520, y: 160, radius: 100, intensity: 0.9 },
      { x: 940, y: 120, radius: 100, intensity: 0.85 },
      { x: 640, y: 340, radius: 130, intensity: 0.95 },
      { x: 1100, y: 200, radius: 105, intensity: 0.75 },
      { x: 760, y: 520, radius: 115, intensity: 0.6 }
    ],
    peak: [
      { x: 320, y: 120, radius: 100, intensity: 0.9 },
      { x: 640, y: 300, radius: 140, intensity: 0.95 },
      { x: 980, y: 120, radius: 95, intensity: 0.75 },
      { x: 860, y: 420, radius: 110, intensity: 0.7 },
      { x: 1100, y: 540, radius: 120, intensity: 0.6 }
    ],
    pie: [
      { x: 640, y: 300, radius: 140, intensity: 0.95 },
      { x: 980, y: 520, radius: 120, intensity: 0.85 },
      { x: 160, y: 240, radius: 100, intensity: 0.8 },
      { x: 520, y: 100, radius: 90, intensity: 0.7 },
      { x: 820, y: 420, radius: 110, intensity: 0.6 }
    ],
    seer: [
      { x: 640, y: 300, radius: 140, intensity: 0.95 },
      { x: 300, y: 120, radius: 100, intensity: 0.85 },
      { x: 980, y: 140, radius: 95, intensity: 0.8 },
      { x: 520, y: 420, radius: 110, intensity: 0.7 },
      { x: 1080, y: 520, radius: 120, intensity: 0.6 }
    ],
    space: [
      { x: 360, y: 140, radius: 100, intensity: 0.9 },
      { x: 640, y: 320, radius: 130, intensity: 0.95 },
      { x: 980, y: 120, radius: 95, intensity: 0.8 },
      { x: 120, y: 200, radius: 100, intensity: 0.85 },
      { x: 920, y: 520, radius: 110, intensity: 0.6 }
    ],
    zuma: [
      { x: 640, y: 220, radius: 130, intensity: 0.95 },
      { x: 240, y: 320, radius: 110, intensity: 0.85 },
      { x: 980, y: 140, radius: 100, intensity: 0.8 },
      { x: 760, y: 420, radius: 115, intensity: 0.7 },
      { x: 1080, y: 540, radius: 120, intensity: 0.6 }
    ]
  };

  const IMPROVED_DESCRIPTIONS = {
    boardto: 'Collaborative project workspace that keeps teams on schedule and aligned.',
    bulletin: 'Shift scheduling and frontline communications for hourly operations.',
    crextio: 'HR toolkit for hiring, onboarding, and people operations at scale.',
    dashdark: 'Real-time web analytics and performance insights for product teams.',
    dasyat: 'All-in-one project planner with timelines, tasks, and milestones.',
    'deep-fi': 'Secure crypto exchange interface for active traders and portfolios.',
    healthcares: 'Patient-centric dashboard for longitudinal health and care insights.',
    mapa: 'Construction planning and site progress visualization for managers.',
    natal: 'Parental health companion with tracking and support resources.',
    neuro: 'Digital product marketplace connecting creators and customers.',
    overcast: 'Social finance app that blends budgeting with community features.',
    peak: 'Business health dashboards highlighting KPIs and growth signals.',
    pie: 'Simple, visual budgeting app to plan spending and savings goals.',
    seer: 'Website analytics that surface conversion opportunities and trends.',
    space: 'Daily task manager designed to boost individual and team focus.',
    zuma: 'Holistic wellness tracker for habits, activity, and sleep.'
  };

  ASSETS.forEach(fname => {
    const { title, desc } = parseFilename(fname);
    const id = idFromTitle(title);
    DASHBOARD_SCENARIOS[id] = {
      id,
      name: title,
      description: IMPROVED_DESCRIPTIONS[id] || desc || '',
      src: `assets/${fname}`,
      points: manual[id] ? manual[id].slice() : []
    };
  });
})();

// --- UI population ---
function createPreviewCard(s) {
  const card = document.createElement('div');
  card.className = 'dashboard-preview';
  card.dataset.dashboard = s.id;
  card.setAttribute('role', 'button');
  card.tabIndex = 0;

  const img = document.createElement('img');
  img.decoding = 'async';
  img.src = encodeURI(s.src);
  img.alt = `${s.name} preview`;
  img.addEventListener('error', () => { img.style.opacity = '0.45'; });
  card.appendChild(img);

  const caption = document.createElement('div');
  caption.className = 'preview-caption';
  const strong = document.createElement('strong');
  strong.textContent = s.name;
  const span = document.createElement('span');
  span.textContent = s.description || '';
  caption.appendChild(strong);
  caption.appendChild(span);
  card.appendChild(caption);

  card.addEventListener('click', () => {
    setActiveDashboard(s.id, { reset: true, showSaved: true });
  });
  card.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ')) { setActiveDashboard(s.id, { reset: true, showSaved: true }); } });
  if (playedDashboards.has(s.id)) {
    card.classList.add('played');
  }
  return card;
}

function populateChooser() {
  if (!dashboardScroll) return;
  dashboardScroll.innerHTML = '';
  Object.values(DASHBOARD_SCENARIOS).forEach((s, i) => {
    const card = createPreviewCard(s);
    if (i === 0) card.classList.add('active');
    dashboardScroll.appendChild(card);
  });
}

// --- Image loader & background ---
function drawBackgroundImage(scenario) {
  const img = new Image();
  img.decoding = 'async';
  img.src = encodeURI(scenario.src);
  img.onload = () => {
    try {
      prototypeCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      prototypeCtx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } catch (e) {
      // drawImage sometimes fails under file:// or cross-origin; ignore and keep heatmap only
      console.warn('drawImage failed', e);
      prototypeCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  };
  img.onerror = () => {
    prototypeCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  };
}

function setActiveDashboard(dashboardId, { reset = true, showSaved = false } = {}) {
  const scenario = DASHBOARD_SCENARIOS[dashboardId];
  if (!scenario) return;
  activeDashboardId = dashboardId;
  // draw background
  drawBackgroundImage(scenario);
  // set heatmap data to curated points
  heatmapData = { points: (scenario.points || []).map(p => ({ ...p })) };
  drawActualHeatmap(heatmapData.points, { reveal: false });

  // update chooser active state
  const previews = Array.from(document.querySelectorAll('.dashboard-preview'));
  previews.forEach(pre => pre.classList.toggle('active', pre.dataset.dashboard === dashboardId));

  if (showSaved) {
    const rec = getPlayedRecord(dashboardId);
    if (rec && rec.predictedPoints) {
      // show the most recent predictions and score, but allow replay
      predictedPoints = rec.predictedPoints.map(p => ({ ...p }));
      latestScore = rec.score || null;
      renderPredictionPoints();
      drawActualHeatmap(heatmapData.points, { reveal: true });
      if (latestScore) setMetrics(`${latestScore.accuracy.toFixed(1)}%`, `${latestScore.overlap.toFixed(1)}%`, `${latestScore.miss.toFixed(1)}%`);
      resultMessage.textContent = latestScore ? buildScoreMessage(latestScore.accuracy) : 'Showing your most recent attempt.';
      shareBtn.disabled = !latestScore;
    } else if (reset) {
      resetPredictionLayer();
    }
  } else {
    if (reset) resetPredictionLayer();
  }
}

// --- Drawing utilities ---
function roundedRect(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

// actual heatmap rendering
function drawActualHeatmap(points, { reveal }) {
  actualCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (!points || !points.length) return;
  points.forEach(point => {
    const radius = point.radius;
    const gradient = actualCtx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    gradient.addColorStop(0, `rgba(255,72,66,${point.intensity * 0.95})`);
    gradient.addColorStop(0.45, `rgba(255,166,61,${point.intensity * 0.72})`);
    gradient.addColorStop(0.8, `rgba(255,234,88,${point.intensity * 0.42})`);
    gradient.addColorStop(1, 'rgba(255,0,0,0)');
    actualCtx.globalCompositeOperation = 'lighter';
    actualCtx.fillStyle = gradient;
    actualCtx.beginPath();
    actualCtx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    actualCtx.fill();
  });
  if (reveal) actualCanvas.classList.add('revealed');
}

function renderPredictionPoints() {
  predictionCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  predictedPoints.forEach((point, index) => {
    const color = THEME_SWATCHES[index % THEME_SWATCHES.length];
    const gradient = predictionCtx.createRadialGradient(point.x, point.y, 0, point.x, point.y, point.radius);
    gradient.addColorStop(0, hexToRgba(color, 0.42));
    gradient.addColorStop(0.55, hexToRgba(color, 0.24));
    gradient.addColorStop(1, hexToRgba(color, 0));
    predictionCtx.globalCompositeOperation = 'lighter';
    predictionCtx.fillStyle = gradient;
    predictionCtx.beginPath();
    predictionCtx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    predictionCtx.fill();

    predictionCtx.globalCompositeOperation = 'source-over';
    predictionCtx.strokeStyle = hexToRgba(color, 0.75);
    predictionCtx.lineWidth = 2;
    predictionCtx.beginPath();
    predictionCtx.arc(point.x, point.y, point.radius * 0.7, 0, Math.PI * 2);
    predictionCtx.stroke();

    predictionCtx.fillStyle = '#2a1a0f';
    predictionCtx.font = '600 15px Poppins';
    predictionCtx.fillText(String(index + 1), point.x - 4, point.y + 5);
  });
}

// --- Input & scoring ---
predictionCanvas.addEventListener('pointerdown', (ev) => {
  if (!hasUnlockedPlay) return;
  if (predictedPoints.length >= MAX_PREDICTION_CIRCLES) {
    resultMessage.textContent = `You already placed ${MAX_PREDICTION_CIRCLES} circles. Clear to try again.`;
    return;
  }
  const rect = predictionCanvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  const x = (ev.clientX - rect.left) * scaleX;
  const y = (ev.clientY - rect.top) * scaleY;
  const minBound = PREDICTION_RADIUS + 8;
  const maxX = CANVAS_WIDTH - minBound;
  const maxY = CANVAS_HEIGHT - minBound;
  predictedPoints.push({ x: Math.max(minBound, Math.min(maxX, x)), y: Math.max(minBound, Math.min(maxY, y)), radius: PREDICTION_RADIUS, intensity: PREDICTION_INTENSITY });
  renderPredictionPoints();
  updateCircleCounter();
  if (predictedPoints.length < MAX_PREDICTION_CIRCLES) {
    resultMessage.textContent = `Place ${MAX_PREDICTION_CIRCLES - predictedPoints.length} more circle(s).`;
  } else {
    resultMessage.textContent = `All ${MAX_PREDICTION_CIRCLES} circles placed. Calculating score...`;
    evaluatePrediction();
  }
});

function updateCircleCounter() {
  if (!circleCounter) return;
  const remaining = Math.max(0, MAX_PREDICTION_CIRCLES - predictedPoints.length);
  circleCounter.textContent = `Heat Circles left: ${remaining}`;
}

clearBtn.addEventListener('click', resetPredictionLayer);
function resetPredictionLayer() {
  predictedPoints = [];
  predictionCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  actualCanvas.classList.remove('revealed');
  latestScore = null;
  shareBtn.disabled = true;
  setMetrics('-', '-', '-');
  updateCircleCounter();
  resultMessage.textContent = hasUnlockedPlay ? `Place ${MAX_PREDICTION_CIRCLES} circles to begin.` : 'Enter your work email to unlock the challenge.';
}

function evaluatePrediction() {
  if (!hasUnlockedPlay) { resultMessage.textContent = 'Enter your work email to unlock the challenge.'; return; }
  if (!heatmapData || !heatmapData.points) { resultMessage.textContent = 'Heatmap not available.'; return; }
  if (predictedPoints.length !== MAX_PREDICTION_CIRCLES) { resultMessage.textContent = `Place all ${MAX_PREDICTION_CIRCLES} circles before scoring.`; return; }

  const score = scoreCirclePredictions(predictedPoints, heatmapData.points);
  latestScore = score;
  setMetrics(`${score.accuracy.toFixed(1)}%`, `${score.overlap.toFixed(1)}%`, `${score.miss.toFixed(1)}%`);
  resultMessage.textContent = buildScoreMessage(score.accuracy);
  drawActualHeatmap(heatmapData.points, { reveal: true });
  shareBtn.disabled = false;
  // save this play record (predictions + score) and mark played
  savePlayedRecord(activeDashboardId, { predictedPoints: predictedPoints.map(p => ({ ...p })), score: latestScore });
  markDashboardPlayed(activeDashboardId);
}

// scoring helpers (kept compact)
function scoreCirclePredictions(predicted, actual) {
  const n = Math.min(predicted.length, actual.length);
  if (n === 0) return { accuracy: 0, overlap: 0, miss: 100 };
  const actualIdx = Array.from({ length: n }, (_, i) => i);
  let bestAssign = -1;
  permute(actualIdx, 0, (perm) => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += circleSimilarity(predicted[i], actual[perm[i]]);
    if (sum > bestAssign) bestAssign = sum;
  });
  let hotspotCoverage = 0;
  for (let i = 0; i < n; i++) {
    let best = 0;
    for (let j = 0; j < n; j++) best = Math.max(best, circleSimilarity(predicted[j], actual[i]));
    hotspotCoverage += best;
  }
  const assignmentScore = (bestAssign / n) * 100;
  const overlap = (hotspotCoverage / n) * 100;
  const accuracy = Math.max(0, Math.min(100, assignmentScore * 0.82 + overlap * 0.18));
  const miss = Math.max(0, 100 - overlap);
  return { accuracy, overlap, miss };
}
function circleSimilarity(a, b) {
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  const tol = Math.max(80, b.radius * 1.15);
  return Math.max(0, 1 - d / tol);
}
function permute(arr, i, visit) { if (i === arr.length - 1) { visit(arr.slice()); return; } for (let j = i; j < arr.length; j++) { [arr[i], arr[j]] = [arr[j], arr[i]]; permute(arr, i + 1, visit); [arr[i], arr[j]] = [arr[j], arr[i]]; } }

function buildScoreMessage(accuracy) {
  if (accuracy >= 88) return 'Elite read. You spotted the friction before the data did.';
  if (accuracy >= 75) return 'Strong instincts. You defeated the heat.';
  if (accuracy >= 55) return 'Close. You found some hotspots, but users surprised you.';
  return "Users zigged while you zagged. Try another prediction.";
}

function setMetrics(accuracy, overlap, miss) { if (accuracyValue) accuracyValue.textContent = accuracy; if (overlapValue) overlapValue.textContent = overlap; if (missValue) missValue.textContent = miss; }

// email gate
emailGateForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = (workEmailInput && workEmailInput.value || '').trim();
  if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { resultMessage.textContent = 'Please enter a valid work email to play.'; return; }
  hasUnlockedPlay = true;
  predictionCanvas.classList.remove('locked');
  predictionCanvas.style.pointerEvents = 'auto';
  resultMessage.textContent = `Great. Place ${MAX_PREDICTION_CIRCLES} circles to begin.`;
});

// share: copy a friendly message to the clipboard and show a toast
shareBtn.addEventListener('click', async () => {
  if (!latestScore) return;
  const percent = Number(latestScore.accuracy.toFixed(1));
  const message = `I scored ${percent}% on Defeat the Heat! 🔥`;
  try {
    await navigator.clipboard.writeText(message);
    showToast('Copied to Clipboard');
  } catch (err) {
    // fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = message;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('Copied to Clipboard'); } catch (e) { showToast('Copy failed'); }
    document.body.removeChild(ta);
  }
});

// small toast helper: shows a transient message near bottom center
function showToast(text, ttl = 1600) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  document.body.appendChild(t);
  // trigger CSS transition
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, ttl);
}

function buildShareCard(score) {
  const c = document.createElement('canvas'); c.width = 1200; c.height = 630; const ctx = c.getContext('2d');
  const bg = ctx.createLinearGradient(0,0,c.width,c.height); bg.addColorStop(0,'#fff8ef'); bg.addColorStop(1,'#f2e5d8'); ctx.fillStyle = bg; ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle = '#1d1f24'; ctx.font = '700 62px Poppins'; ctx.fillText('Defeat the Heat', 72, 152);
  ctx.font = '600 30px Poppins'; ctx.fillStyle = '#ff7a2f'; ctx.fillText(`Score: ${score.accuracy.toFixed(1)}%`, 72, 230);
  ctx.font = '500 24px Poppins'; ctx.fillStyle = '#5f5850'; ctx.fillText(`Scenario: ${DASHBOARD_SCENARIOS[activeDashboardId].name}`, 72, 290);
  return c.toDataURL('image/png');
}

// leaderboard
const LEADERBOARD_KEY = 'defeat-the-heat-leaderboard-v1';
function getLeaderboard() { try { const raw = localStorage.getItem(LEADERBOARD_KEY); if (!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function saveLeaderboardScore(entry) {
  const current = getLeaderboard();
  const updated = [...current, entry]
    .sort((a, b) => b.score - a.score || a.createdAt - b.createdAt)
    .slice(0, 10);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
}

function renderLeaderboard() {
  const items = getLeaderboard();
  leaderboardEl.innerHTML = '';
  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'leaderboard-item';
    empty.textContent = 'No scores yet.';
    leaderboardEl.appendChild(empty);
    return;
  }
  items.forEach((it, idx) => {
    const node = leaderboardTemplate.content.firstElementChild.cloneNode(true);
    const scenarioLabel = it.scenarioName ? ` — ${it.scenarioName}` : '';
    node.querySelector('.lb-name').textContent = `${idx + 1}. ${it.name}${scenarioLabel}`;
    node.querySelector('.lb-score').textContent = `${it.score.toFixed(1)}%`;
    leaderboardEl.appendChild(node);
  });
}

nameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!latestScore) { resultMessage.textContent = 'Submit your prediction before saving your score.'; return; }
  const name = (playerNameInput.value || '').trim();
  if (!name) return;
  const scenarioName = (DASHBOARD_SCENARIOS[activeDashboardId] && DASHBOARD_SCENARIOS[activeDashboardId].name) || '';
  saveLeaderboardScore({ name, score: Number(latestScore.accuracy.toFixed(1)), scenarioName, createdAt: Date.now() });
  playerNameInput.value = '';
  renderLeaderboard();
});

// utilities
function hexToRgba(hex, alpha) { const n = hex.replace('#',''); const full = n.length===3 ? n.split('').map(c=>c+c).join('') : n; const i = parseInt(full,16); const r = (i>>16)&255; const g = (i>>8)&255; const b = i&255; return `rgba(${r},${g},${b},${alpha})`; }

// init
function init() {
  // ensure canvases sized
  [prototypeCanvas, predictionCanvas, actualCanvas].forEach(c => { if (c) { c.width = CANVAS_WIDTH; c.height = CANVAS_HEIGHT; } });
  populateChooser();
  // activate first
  const first = Object.keys(DASHBOARD_SCENARIOS)[0]; if (first) setActiveDashboard(first, { reset: true });
  setPlayLocked(true);
  renderLeaderboard();
}

function setPlayLocked(locked) {
  hasUnlockedPlay = !locked ? hasUnlockedPlay : false;
  predictionCanvas.classList.toggle('locked', locked);
  predictionCanvas.style.pointerEvents = locked ? 'none' : 'auto';
  clearBtn.disabled = locked;
  if (startBtn) startBtn.disabled = !locked;
  if (workEmailInput) workEmailInput.readOnly = !locked;
}

init();
