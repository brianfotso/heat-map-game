const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const GRID_SIZE = 64;
const CELL_W = CANVAS_WIDTH / GRID_SIZE;
const CELL_H = CANVAS_HEIGHT / GRID_SIZE;
const LEADERBOARD_KEY = "defeat-the-heat-leaderboard-v1";
const MAX_PREDICTION_CIRCLES = 5;
const PREDICTION_RADIUS = 112;
const PREDICTION_INTENSITY = 0.9;
const THEME_SWATCHES = ["#ad95d0", "#ff733a", "#83bbcd", "#ced255"];

const prototypeCanvas = document.getElementById("prototype-canvas");
const predictionCanvas = document.getElementById("prediction-canvas");
const actualCanvas = document.getElementById("actual-canvas");

const clearBtn = document.getElementById("clear-btn");
const submitBtn = document.getElementById("submit-btn");
const shareBtn = document.getElementById("share-btn");
const emailGateForm = document.getElementById("email-gate-form");
const workEmailInput = document.getElementById("work-email");
const startBtn = document.getElementById("start-btn");

const accuracyValue = document.getElementById("accuracy-value");
const overlapValue = document.getElementById("overlap-value");
const missValue = document.getElementById("miss-value");
const resultMessage = document.getElementById("result-message");

const leaderboardEl = document.getElementById("leaderboard");
const nameForm = document.getElementById("name-form");
const playerNameInput = document.getElementById("player-name");
const leaderboardTemplate = document.getElementById("leaderboard-item-template");
const dashboardButtons = Array.from(document.querySelectorAll(".dashboard-option"));
const selectedDashboardLabel = document.getElementById("selected-dashboard-label");
const circleCounter = document.getElementById("circle-counter");

const prototypeCtx = prototypeCanvas.getContext("2d");
const predictionCtx = predictionCanvas.getContext("2d");
const actualCtx = actualCanvas.getContext("2d");

let latestScore = null;
let heatmapData = null;
let activeDashboardId = "northstar";
let hasUnlockedPlay = false;
let predictedPoints = [];

const DASHBOARD_SCENARIOS = {
  northstar: {
    name: "Northstar Commerce OS",
    points: [
      { x: 1128, y: 340, radius: 125, intensity: 1.0 },
      { x: 978, y: 193, radius: 105, intensity: 0.78 },
      { x: 660, y: 193, radius: 115, intensity: 0.68 },
      { x: 505, y: 318, radius: 120, intensity: 0.58 },
      { x: 722, y: 502, radius: 148, intensity: 0.66 },
    ],
    draw: drawNorthstarScene,
  },
  fleetpulse: {
    name: "FleetPulse Control Center",
    points: [
      { x: 408, y: 206, radius: 112, intensity: 0.82 },
      { x: 644, y: 206, radius: 112, intensity: 0.92 },
      { x: 888, y: 206, radius: 106, intensity: 0.72 },
      { x: 1088, y: 374, radius: 128, intensity: 0.98 },
      { x: 818, y: 404, radius: 140, intensity: 0.74 },
    ],
    draw: drawFleetpulseScene,
  },
  caregrid: {
    name: "CareGrid Clinical Insights",
    points: [
      { x: 378, y: 206, radius: 110, intensity: 0.78 },
      { x: 620, y: 206, radius: 112, intensity: 0.66 },
      { x: 858, y: 206, radius: 110, intensity: 0.72 },
      { x: 1120, y: 206, radius: 118, intensity: 0.98 },
      { x: 802, y: 432, radius: 140, intensity: 0.86 },
    ],
    draw: drawCaregridScene,
  },
  vaultix: {
    name: "Vaultix Treasury IQ",
    points: [
      { x: 414, y: 206, radius: 102, intensity: 0.9 },
      { x: 644, y: 206, radius: 106, intensity: 0.82 },
      { x: 896, y: 206, radius: 98, intensity: 0.68 },
      { x: 1120, y: 206, radius: 116, intensity: 0.88 },
      { x: 1118, y: 356, radius: 124, intensity: 1.0 },
    ],
    draw: drawVaultixScene,
  },
};

init();

function init() {
  setActiveDashboard(activeDashboardId, { reset: false });
  resetPredictionLayer();
  attachDrawHandlers();
  attachActions();
  attachDashboardPicker();
  attachEmailGate();
  setPlayLockState(true);
  renderLeaderboard();
}

function attachDashboardPicker() {
  dashboardButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const dashboardId = button.dataset.dashboard;
      if (!dashboardId || dashboardId === activeDashboardId) return;
      setActiveDashboard(dashboardId, { reset: true });
    });
  });
}

function setActiveDashboard(dashboardId, { reset }) {
  const scenario = DASHBOARD_SCENARIOS[dashboardId];
  if (!scenario) return;

  activeDashboardId = dashboardId;
  heatmapData = { points: scenario.points };
  scenario.draw();
  drawActualHeatmap(heatmapData.points, { reveal: false });

  if (selectedDashboardLabel) {
    selectedDashboardLabel.textContent = `Currently playing: ${scenario.name}`;
  }

  dashboardButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.dashboard === dashboardId);
  });

  if (reset) {
    resetPredictionLayer();
  }
}

function drawNorthstarScene() {
  const g = prototypeCtx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  g.addColorStop(0, "#f7efe4");
  g.addColorStop(1, "#f2e7d9");
  prototypeCtx.fillStyle = g;
  prototypeCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Top bar
  roundedRect(prototypeCtx, 0, 0, CANVAS_WIDTH, 84, 0, "#ffffff");
  prototypeCtx.fillStyle = "#1d1f24";
  prototypeCtx.font = "700 28px Avenir Next";
  prototypeCtx.fillText("Northstar Intelligence", 34, 52);

  roundedRect(prototypeCtx, 370, 20, 390, 44, 11, "#f8f2e9");
  prototypeCtx.fillStyle = "#7a7269";
  prototypeCtx.font = "500 18px Avenir Next";
  prototypeCtx.fillText("Search users, sessions, pages, drop-off events", 390, 48);

  roundedRect(prototypeCtx, 785, 20, 180, 44, 11, "#f8f2e9");
  prototypeCtx.fillStyle = "#4f4943";
  prototypeCtx.font = "600 17px Avenir Next";
  prototypeCtx.fillText("Last 30 days", 820, 48);

  roundedRect(prototypeCtx, 975, 20, 122, 44, 11, "#fff2e8");
  prototypeCtx.fillStyle = "#d86a27";
  prototypeCtx.font = "600 17px Avenir Next";
  prototypeCtx.fillText("+ New Test", 993, 48);

  roundedRect(prototypeCtx, 1115, 20, 132, 44, 11, "#262a33");
  prototypeCtx.fillStyle = "#f7f1e9";
  prototypeCtx.font = "600 17px Avenir Next";
  prototypeCtx.fillText("Export CSV", 1140, 48);

  // Left rail
  roundedRect(prototypeCtx, 22, 98, 250, 600, 16, "#ffffff");
  roundedRect(prototypeCtx, 38, 114, 216, 72, 12, "#f8f2e9");
  prototypeCtx.fillStyle = "#4f4943";
  prototypeCtx.font = "600 15px Avenir Next";
  prototypeCtx.fillText("Workspace", 56, 142);
  prototypeCtx.fillStyle = "#1d1f24";
  prototypeCtx.font = "700 20px Avenir Next";
  prototypeCtx.fillText("Northstar Core", 56, 168);

  const menuItems = ["Overview", "Funnels", "Insight AI", "Heatmaps", "Audience", "Experiments", "Settings"];
  prototypeCtx.font = "600 18px Avenir Next";
  menuItems.forEach((item, index) => {
    const y = 232 + index * 56;
    const active = item === "Insight AI";
    if (active) {
      roundedRect(prototypeCtx, 38, y - 28, 216, 40, 10, "#ffe6d5");
      prototypeCtx.fillStyle = "#1d1f24";
    } else {
      prototypeCtx.fillStyle = "#6e675f";
    }
    prototypeCtx.fillText(item, 66, y);
    prototypeCtx.fillStyle = active ? "#ff7a2f" : "#c8bdb0";
    prototypeCtx.beginPath();
    prototypeCtx.arc(50, y - 8, 5, 0, Math.PI * 2);
    prototypeCtx.fill();
  });

  roundedRect(prototypeCtx, 38, 600, 216, 78, 12, "#262a33");
  prototypeCtx.fillStyle = "#f4eee7";
  prototypeCtx.font = "600 15px Avenir Next";
  prototypeCtx.fillText("AI Risk Monitor", 54, 628);
  prototypeCtx.font = "700 22px Avenir Next";
  prototypeCtx.fillText("3 High Alerts", 54, 656);

  // KPI row
  const cardY = 98;
  const cards = [
    { x: 294, w: 228, title: "Live Sessions", value: "1,842", delta: "+12.4%" },
    { x: 536, w: 228, title: "Conversion Rate", value: "6.8%", delta: "+0.9%" },
    { x: 778, w: 228, title: "Drop-off Risk", value: "34%", delta: "-2.1%" },
    { x: 1020, w: 238, title: "AI Suggestions", value: "12", delta: "4 urgent" },
  ];
  cards.forEach((card, index) => {
    roundedRect(prototypeCtx, card.x, cardY, card.w, 128, 14, "#ffffff");
    prototypeCtx.fillStyle = "#5a544d";
    prototypeCtx.font = "600 16px Avenir Next";
    prototypeCtx.fillText(card.title, card.x + 16, cardY + 30);
    prototypeCtx.fillStyle = "#1d1f24";
    prototypeCtx.font = "700 35px Avenir Next";
    prototypeCtx.fillText(card.value, card.x + 16, cardY + 74);
    prototypeCtx.fillStyle = index === 2 ? "#cd4638" : "#e06f2b";
    prototypeCtx.font = "600 15px Avenir Next";
    prototypeCtx.fillText(card.delta, card.x + 16, cardY + 103);

    // Sparkline in each card
    prototypeCtx.strokeStyle = "rgba(255,122,47,0.55)";
    prototypeCtx.lineWidth = 2.4;
    prototypeCtx.beginPath();
    prototypeCtx.moveTo(card.x + card.w - 90, cardY + 88);
    prototypeCtx.bezierCurveTo(
      card.x + card.w - 72,
      cardY + 60 + index * 2,
      card.x + card.w - 40,
      cardY + 102 - index * 3,
      card.x + card.w - 18,
      cardY + 72
    );
    prototypeCtx.stroke();
  });

  // Main trend panel
  roundedRect(prototypeCtx, 294, 242, 676, 450, 16, "#ffffff");
  prototypeCtx.fillStyle = "#1d1f24";
  prototypeCtx.font = "700 21px Avenir Next";
  prototypeCtx.fillText("Checkout Funnel Performance", 320, 278);
  prototypeCtx.fillStyle = "#5d5851";
  prototypeCtx.font = "500 15px Avenir Next";
  prototypeCtx.fillText("By step completion, hesitation, and rage-click concentration", 320, 300);

  roundedRect(prototypeCtx, 774, 258, 176, 34, 10, "#f8f2e9");
  prototypeCtx.fillStyle = "#4f4943";
  prototypeCtx.font = "600 14px Avenir Next";
  prototypeCtx.fillText("Segment: Returning", 788, 280);

  // Graph area and grid
  const graphX = 320;
  const graphY = 326;
  const graphW = 624;
  const graphH = 264;
  roundedRect(prototypeCtx, graphX, graphY, graphW, graphH, 12, "#fcf8f3");
  prototypeCtx.strokeStyle = "rgba(28,31,38,0.1)";
  prototypeCtx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) {
    const y = graphY + 20 + i * 38;
    prototypeCtx.beginPath();
    prototypeCtx.moveTo(graphX + 16, y);
    prototypeCtx.lineTo(graphX + graphW - 16, y);
    prototypeCtx.stroke();
  }
  for (let i = 0; i <= 7; i += 1) {
    const x = graphX + 30 + i * 78;
    prototypeCtx.beginPath();
    prototypeCtx.moveTo(x, graphY + 14);
    prototypeCtx.lineTo(x, graphY + graphH - 14);
    prototypeCtx.stroke();
  }

  // Baseline series
  prototypeCtx.strokeStyle = "rgba(38,42,51,0.48)";
  prototypeCtx.lineWidth = 3;
  prototypeCtx.beginPath();
  prototypeCtx.moveTo(graphX + 34, graphY + 204);
  prototypeCtx.bezierCurveTo(graphX + 112, graphY + 182, graphX + 208, graphY + 236, graphX + 286, graphY + 198);
  prototypeCtx.bezierCurveTo(graphX + 374, graphY + 148, graphX + 476, graphY + 220, graphX + 586, graphY + 170);
  prototypeCtx.stroke();

  // Current series
  prototypeCtx.strokeStyle = "#ff7a2f";
  prototypeCtx.lineWidth = 4;
  prototypeCtx.beginPath();
  prototypeCtx.moveTo(graphX + 34, graphY + 224);
  prototypeCtx.bezierCurveTo(graphX + 130, graphY + 132, graphX + 212, graphY + 258, graphX + 302, graphY + 172);
  prototypeCtx.bezierCurveTo(graphX + 382, graphY + 106, graphX + 472, graphY + 214, graphX + 586, graphY + 134);
  prototypeCtx.stroke();

  // Highlight marker
  const markerX = graphX + 458;
  const markerY = graphY + 184;
  prototypeCtx.fillStyle = "#ff7a2f";
  prototypeCtx.beginPath();
  prototypeCtx.arc(markerX, markerY, 8, 0, Math.PI * 2);
  prototypeCtx.fill();
  roundedRect(prototypeCtx, markerX + 18, markerY - 30, 138, 40, 10, "#262a33");
  prototypeCtx.fillStyle = "#f7efe7";
  prototypeCtx.font = "600 14px Avenir Next";
  prototypeCtx.fillText("Rage clicks +21%", markerX + 30, markerY - 6);

  // Legend
  prototypeCtx.fillStyle = "#6b655e";
  prototypeCtx.font = "500 14px Avenir Next";
  prototypeCtx.fillRect(graphX + 20, 605, 18, 4);
  prototypeCtx.fillText("Previous period", graphX + 46, 610);
  prototypeCtx.fillStyle = "#ff7a2f";
  prototypeCtx.fillRect(graphX + 196, 605, 18, 4);
  prototypeCtx.fillStyle = "#6b655e";
  prototypeCtx.fillText("Current period", graphX + 222, 610);

  // Right-side analysis panel
  roundedRect(prototypeCtx, 984, 242, 274, 450, 16, "#ffffff");
  prototypeCtx.fillStyle = "#1d1f24";
  prototypeCtx.font = "700 19px Avenir Next";
  prototypeCtx.fillText("AI Opportunity Feed", 1006, 276);

  roundedRect(prototypeCtx, 1002, 292, 238, 116, 12, "#fcf7f1");
  prototypeCtx.fillStyle = "#5f5951";
  prototypeCtx.font = "600 14px Avenir Next";
  prototypeCtx.fillText("Checkout Step Funnel", 1018, 316);
  const funnel = [
    { label: "Cart", pct: 100 },
    { label: "Address", pct: 82 },
    { label: "Payment", pct: 61 },
    { label: "Review", pct: 39 },
  ];
  funnel.forEach((step, index) => {
    const y = 334 + index * 18;
    prototypeCtx.fillStyle = "#6f6961";
    prototypeCtx.font = "500 12px Avenir Next";
    prototypeCtx.fillText(step.label, 1018, y);
    roundedRect(prototypeCtx, 1076, y - 10, 145, 9, 4, "#eee5da");
    roundedRect(prototypeCtx, 1076, y - 10, (145 * step.pct) / 100, 9, 4, "#ff7a2f");
  });

  roundedRect(prototypeCtx, 1002, 424, 238, 126, 12, "#fcf7f1");
  prototypeCtx.fillStyle = "#5f5951";
  prototypeCtx.font = "600 14px Avenir Next";
  prototypeCtx.fillText("Priority Recommendations", 1018, 448);
  const recs = [
    "Move promo code below payment CTA",
    "Auto-focus ZIP on mobile keyboard",
    "Reduce shipping calculator fields",
  ];
  recs.forEach((line, index) => {
    prototypeCtx.fillStyle = "#6f6961";
    prototypeCtx.font = "500 12px Avenir Next";
    prototypeCtx.fillText(`• ${line}`, 1018, 474 + index * 23);
  });

  roundedRect(prototypeCtx, 1002, 566, 238, 106, 12, "#fff2e8");
  prototypeCtx.fillStyle = "#c34f2f";
  prototypeCtx.font = "700 14px Avenir Next";
  prototypeCtx.fillText("Critical friction spike detected", 1018, 592);
  prototypeCtx.fillStyle = "#6d4a3a";
  prototypeCtx.font = "500 12px Avenir Next";
  prototypeCtx.fillText("Payment form abandonment rose 18% after", 1018, 614);
  prototypeCtx.fillText("new validation release.", 1018, 632);
  roundedRect(prototypeCtx, 1136, 642, 92, 22, 8, "#262a33");
  prototypeCtx.fillStyle = "#f8f2ea";
  prototypeCtx.font = "600 12px Avenir Next";
  prototypeCtx.fillText("Fix Now", 1163, 658);

  // Bottom table under chart
  roundedRect(prototypeCtx, 320, 626, 624, 54, 10, "#fcf8f3");
  prototypeCtx.fillStyle = "#625b53";
  prototypeCtx.font = "600 13px Avenir Next";
  prototypeCtx.fillText("Session Cluster", 338, 649);
  prototypeCtx.fillText("Visitors", 520, 649);
  prototypeCtx.fillText("Avg Time", 610, 649);
  prototypeCtx.fillText("Rage Clicks", 706, 649);
  prototypeCtx.fillText("Opportunity", 824, 649);

  const rows = [
    ["Mobile first-time", "542", "02:11", "23", 0.81],
    ["Desktop returning", "312", "03:02", "9", 0.56],
  ];
  rows.forEach((row, index) => {
    const y = 668 + index * 24;
    roundedRect(prototypeCtx, 320, y - 16, 624, 20, 8, index === 0 ? "#fff2e8" : "#f7f2eb");
    prototypeCtx.fillStyle = "#3f3a35";
    prototypeCtx.font = "500 12px Avenir Next";
    prototypeCtx.fillText(row[0], 338, y - 2);
    prototypeCtx.fillText(row[1], 526, y - 2);
    prototypeCtx.fillText(row[2], 610, y - 2);
    prototypeCtx.fillText(row[3], 720, y - 2);
    roundedRect(prototypeCtx, 824, y - 12, 96, 8, 4, "#e8dfd2");
    roundedRect(prototypeCtx, 824, y - 12, 96 * row[4], 8, 4, "#ff7a2f");
  });
}

function drawFleetpulseScene() {
  const g = prototypeCtx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  g.addColorStop(0, "#f7f3ff");
  g.addColorStop(1, "#eee6ff");
  prototypeCtx.fillStyle = g;
  prototypeCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  roundedRect(prototypeCtx, 0, 0, CANVAS_WIDTH, 82, 0, "#ffffff");
  prototypeCtx.fillStyle = "#1f2f46";
  prototypeCtx.font = "700 27px Poppins";
  prototypeCtx.fillText("FleetPulse Control Center", 28, 50);
  prototypeCtx.fillStyle = "#6b7f9c";
  prototypeCtx.font = "500 14px Poppins";
  prototypeCtx.fillText("Operational visibility across routes, depots, and incident response", 28, 71);
  roundedRect(prototypeCtx, 918, 20, 152, 42, 10, "#f0f5ff");
  roundedRect(prototypeCtx, 1082, 20, 164, 42, 10, "#2f7cff");
  prototypeCtx.fillStyle = "#3f5678";
  prototypeCtx.font = "600 14px Poppins";
  prototypeCtx.fillText("Last 24h", 964, 46);
  prototypeCtx.fillStyle = "#f3f8ff";
  prototypeCtx.fillText("Dispatch Actions", 1110, 46);

  roundedRect(prototypeCtx, 18, 96, 206, 600, 12, "#ffffff");
  prototypeCtx.fillStyle = "#465d7f";
  prototypeCtx.font = "600 14px Poppins";
  prototypeCtx.fillText("Filters", 40, 128);
  const filters = ["All Fleets", "Priority Loads", "Delayed Routes", "Fuel Exceptions", "Weather Risk", "Heatmaps"];
  filters.forEach((filter, i) => {
    const y = 156 + i * 76;
    roundedRect(prototypeCtx, 36, y, 170, 50, 10, filter === "Heatmaps" ? "#dbe8ff" : "#f4f8ff");
    prototypeCtx.fillStyle = filter === "Heatmaps" ? "#2f4f88" : "#6880a3";
    prototypeCtx.font = "600 13px Poppins";
    prototypeCtx.fillText(filter, 50, y + 30);
  });
  roundedRect(prototypeCtx, 36, 628, 170, 50, 10, "#ffebdf");
  prototypeCtx.fillStyle = "#d36233";
  prototypeCtx.font = "600 13px Poppins";
  prototypeCtx.fillText("7 critical alerts", 58, 658);

  const kpis = [
    ["Active Trucks", "128", "+6"],
    ["On-time Delivery", "92.4%", "+1.8%"],
    ["Delay Risk", "12%", "-2.4%"],
    ["Fuel Drift", "4.7%", "-0.6%"],
  ];
  kpis.forEach((kpi, i) => {
    const x = 242 + i * 256;
    roundedRect(prototypeCtx, x, 96, 242, 118, 12, "#ffffff");
    prototypeCtx.fillStyle = "#687f9f";
    prototypeCtx.font = "600 14px Poppins";
    prototypeCtx.fillText(kpi[0], x + 14, 126);
    prototypeCtx.fillStyle = "#253957";
    prototypeCtx.font = "700 33px Poppins";
    prototypeCtx.fillText(kpi[1], x + 14, 169);
    prototypeCtx.fillStyle = "#2f7cff";
    prototypeCtx.font = "600 13px Poppins";
    prototypeCtx.fillText(kpi[2], x + 14, 194);
  });

  roundedRect(prototypeCtx, 242, 228, 684, 468, 12, "#ffffff");
  prototypeCtx.fillStyle = "#233959";
  prototypeCtx.font = "700 20px Poppins";
  prototypeCtx.fillText("Live Route Map", 264, 262);
  roundedRect(prototypeCtx, 264, 282, 640, 286, 10, "#f6f9ff");
  prototypeCtx.strokeStyle = "rgba(72, 106, 154, 0.16)";
  prototypeCtx.lineWidth = 1;
  for (let i = 0; i < 9; i += 1) {
    const x = 282 + i * 72;
    prototypeCtx.beginPath();
    prototypeCtx.moveTo(x, 302);
    prototypeCtx.lineTo(x, 548);
    prototypeCtx.stroke();
  }
  for (let i = 0; i < 6; i += 1) {
    const y = 310 + i * 46;
    prototypeCtx.beginPath();
    prototypeCtx.moveTo(274, y);
    prototypeCtx.lineTo(894, y);
    prototypeCtx.stroke();
  }

  const routes = [
    [288, 536, 410, 442, 528, 512, 646, 412, 868, 468, "#2f7cff"],
    [286, 504, 414, 362, 544, 432, 664, 336, 870, 378, "#ff733a"],
    [292, 454, 430, 302, 560, 374, 682, 274, 868, 316, "#ad95d0"],
  ];
  routes.forEach((route) => {
    prototypeCtx.strokeStyle = route[10];
    prototypeCtx.lineWidth = 4;
    prototypeCtx.beginPath();
    prototypeCtx.moveTo(route[0], route[1]);
    prototypeCtx.bezierCurveTo(route[2], route[3], route[4], route[5], route[6], route[7]);
    prototypeCtx.lineTo(route[8], route[9]);
    prototypeCtx.stroke();
  });

  [ [358, 498], [476, 392], [596, 452], [734, 350], [824, 424] ].forEach((pt, i) => {
    roundedRect(prototypeCtx, pt[0], pt[1], 16, 16, 8, i % 2 === 0 ? "#2f7cff" : "#ff733a");
  });
  const waypoints = [
    ["WP-A3", 346, 490],
    ["WP-C7", 466, 384],
    ["WP-F2", 588, 444],
    ["WP-H5", 726, 342],
    ["WP-J1", 816, 416],
  ];
  waypoints.forEach((w) => {
    prototypeCtx.fillStyle = "#5f7698";
    prototypeCtx.font = "500 11px Poppins";
    prototypeCtx.fillText(w[0], w[1], w[2]);
  });

  roundedRect(prototypeCtx, 274, 532, 284, 34, 8, "#edf4ff");
  prototypeCtx.fillStyle = "#5c7394";
  prototypeCtx.font = "500 11px Poppins";
  prototypeCtx.fillText("Legend", 286, 553);
  roundedRect(prototypeCtx, 334, 544, 20, 4, 2, "#2f7cff");
  prototypeCtx.fillText("Primary lane", 360, 553);
  roundedRect(prototypeCtx, 434, 544, 20, 4, 2, "#ff733a");
  prototypeCtx.fillText("Risk lane", 460, 553);

  roundedRect(prototypeCtx, 264, 584, 640, 92, 10, "#f7faff");
  prototypeCtx.fillStyle = "#536b8d";
  prototypeCtx.font = "600 13px Poppins";
  prototypeCtx.fillText("Depot Throughput", 282, 612);
  const depots = [
    ["ATL", 86],
    ["CHI", 74],
    ["DAL", 92],
    ["LAX", 68],
    ["SEA", 58],
  ];
  depots.forEach((depot, i) => {
    const x = 282 + i * 122;
    prototypeCtx.fillStyle = "#617a9d";
    prototypeCtx.font = "500 12px Poppins";
    prototypeCtx.fillText(depot[0], x, 637);
    roundedRect(prototypeCtx, x, 646, 92, 10, 5, "#e3ecfb");
    roundedRect(prototypeCtx, x, 646, (92 * depot[1]) / 100, 10, 5, i % 2 ? "#83bbcd" : "#2f7cff");
  });

  roundedRect(prototypeCtx, 620, 598, 272, 70, 8, "#edf3ff");
  prototypeCtx.fillStyle = "#566f94";
  prototypeCtx.font = "600 12px Poppins";
  prototypeCtx.fillText("Delay Trend (7d)", 636, 618);
  prototypeCtx.strokeStyle = "#2f7cff";
  prototypeCtx.lineWidth = 2;
  prototypeCtx.beginPath();
  prototypeCtx.moveTo(636, 646);
  prototypeCtx.bezierCurveTo(676, 620, 714, 652, 752, 632);
  prototypeCtx.bezierCurveTo(786, 616, 824, 640, 868, 626);
  prototypeCtx.stroke();

  roundedRect(prototypeCtx, 942, 228, 318, 468, 12, "#ffffff");
  prototypeCtx.fillStyle = "#233959";
  prototypeCtx.font = "700 20px Poppins";
  prototypeCtx.fillText("Incident Queue", 964, 262);
  const incidents = [
    ["Fuel variance spike", "Truck 482 / I-75", "High", "#ff733a", "Ops A", "12m"],
    ["Dock congestion", "Atlanta Hub", "Medium", "#ad95d0", "Ops C", "28m"],
    ["Weather delay", "Denver corridor", "High", "#ff733a", "Ops B", "8m"],
    ["Idle anomaly", "Team Delta", "Low", "#83bbcd", "Ops D", "35m"],
  ];
  incidents.forEach((item, i) => {
    const y = 286 + i * 104;
    roundedRect(prototypeCtx, 962, y, 278, 90, 10, "#f6f9ff");
    roundedRect(prototypeCtx, 974, y + 16, 8, 58, 4, item[3]);
    prototypeCtx.fillStyle = "#2f4668";
    prototypeCtx.font = "600 13px Poppins";
    prototypeCtx.fillText(item[0], 992, y + 32);
    prototypeCtx.fillStyle = "#6b7f9b";
    prototypeCtx.font = "500 12px Poppins";
    prototypeCtx.fillText(item[1], 992, y + 56);
    prototypeCtx.fillText(`${item[4]} • ETA ${item[5]}`, 992, y + 73);
    roundedRect(prototypeCtx, 1152, y + 16, 70, 28, 8, item[3]);
    prototypeCtx.fillStyle = "#27303d";
    prototypeCtx.font = "600 11px Poppins";
    prototypeCtx.fillText(item[2], 1174, y + 35);
    roundedRect(prototypeCtx, 1148, y + 52, 74, 22, 7, "#e6eefc");
    prototypeCtx.fillStyle = "#2f4f88";
    prototypeCtx.font = "600 10px Poppins";
    prototypeCtx.fillText("Assign", 1171, y + 67);
  });
}

function drawCaregridScene() {
  const g = prototypeCtx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  g.addColorStop(0, "#f5f9ff");
  g.addColorStop(1, "#e8f2ff");
  prototypeCtx.fillStyle = g;
  prototypeCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  roundedRect(prototypeCtx, 0, 0, CANVAS_WIDTH, 86, 0, "#ffffff");
  prototypeCtx.fillStyle = "#253b33";
  prototypeCtx.font = "700 26px Poppins";
  prototypeCtx.fillText("CareGrid Clinical Operations", 28, 52);
  prototypeCtx.fillStyle = "#6a7c75";
  prototypeCtx.font = "500 13px Poppins";
  prototypeCtx.fillText("Patient flow, staffing, and bottleneck visibility across departments", 28, 72);
  roundedRect(prototypeCtx, 856, 18, 124, 34, 8, "#e9eeeb");
  roundedRect(prototypeCtx, 990, 18, 128, 34, 8, "#dce8e2");
  roundedRect(prototypeCtx, 1128, 18, 118, 34, 8, "#d8e7e0");
  prototypeCtx.fillStyle = "#4b6158";
  prototypeCtx.font = "600 12px Poppins";
  prototypeCtx.fillText("Downtown", 888, 39);
  prototypeCtx.fillText("All Departments", 1012, 39);
  prototypeCtx.fillText("Live Refresh", 1156, 39);

  roundedRect(prototypeCtx, 20, 102, 1240, 110, 12, "#ffffff");
  const summary = [
    ["Queue", "84", "-4"],
    ["Avg Wait", "18m", "-3m"],
    ["Utilization", "81%", "+2.1%"],
    ["No-show Risk", "12%", "-1.3%"],
    ["Critical", "7", "+1"],
  ];
  summary.forEach((item, i) => {
    const x = 42 + i * 244;
    roundedRect(prototypeCtx, x, 124, 224, 66, 9, "#f6f8f7");
    prototypeCtx.fillStyle = "#61736c";
    prototypeCtx.font = "600 12px Poppins";
    prototypeCtx.fillText(item[0], x + 12, 146);
    prototypeCtx.fillStyle = "#2c433a";
    prototypeCtx.font = "700 23px Poppins";
    prototypeCtx.fillText(item[1], x + 12, 174);
    prototypeCtx.fillStyle = "#7b8b85";
    prototypeCtx.font = "600 12px Poppins";
    prototypeCtx.fillText(item[2], x + 170, 174);
    roundedRect(prototypeCtx, x + 174, 134, 38, 12, 6, i % 2 === 0 ? "#d9e8e0" : "#e5edf6");
  });

  roundedRect(prototypeCtx, 20, 228, 402, 464, 12, "#ffffff");
  prototypeCtx.fillStyle = "#2b4239";
  prototypeCtx.font = "700 18px Poppins";
  prototypeCtx.fillText("Triage Board", 40, 260);
  roundedRect(prototypeCtx, 294, 244, 44, 18, 6, "#d8e8df");
  roundedRect(prototypeCtx, 344, 244, 54, 18, 6, "#e6edf7");
  prototypeCtx.fillStyle = "#53665e";
  prototypeCtx.font = "600 10px Poppins";
  prototypeCtx.fillText("Urgent", 304, 257);
  prototypeCtx.fillText("Monitor", 357, 257);
  const triageRows = [
    ["Patient 412", "Cardiac pain", "ER-A", "High"],
    ["Patient 301", "Post-op follow-up", "Ward-2", "Medium"],
    ["Patient 556", "Lab review", "Clinic-B", "Low"],
    ["Patient 227", "Respiratory distress", "ER-C", "High"],
    ["Patient 198", "Discharge pending", "Ward-1", "Medium"],
  ];
  triageRows.forEach((row, i) => {
    const y = 282 + i * 82;
    roundedRect(prototypeCtx, 38, y, 366, 70, 10, "#f4f6f5");
    roundedRect(prototypeCtx, 50, y + 16, 10, 38, 4, row[3] === "High" ? "#b3725a" : row[3] === "Medium" ? "#96a59f" : "#bdc7c3");
    prototypeCtx.fillStyle = "#334b42";
    prototypeCtx.font = "600 13px Poppins";
    prototypeCtx.fillText(row[0], 72, y + 28);
    prototypeCtx.fillStyle = "#6e7f78";
    prototypeCtx.font = "500 12px Poppins";
    prototypeCtx.fillText(row[1], 72, y + 49);
    prototypeCtx.fillText(row[2], 280, y + 49);
    roundedRect(prototypeCtx, 306, y + 14, 84, 26, 7, row[3] === "High" ? "#efe1db" : row[3] === "Medium" ? "#e2e9e6" : "#e8eeeb");
    prototypeCtx.fillStyle = "#4f625b";
    prototypeCtx.font = "600 11px Poppins";
    prototypeCtx.fillText(row[3], 332, y + 31);
    roundedRect(prototypeCtx, 266, y + 14, 32, 26, 7, "#ddeae3");
    prototypeCtx.fillStyle = "#5b6f67";
    prototypeCtx.font = "600 10px Poppins";
    prototypeCtx.fillText("Open", 273, y + 31);
  });

  roundedRect(prototypeCtx, 438, 228, 566, 464, 12, "#ffffff");
  prototypeCtx.fillStyle = "#2b4239";
  prototypeCtx.font = "700 18px Poppins";
  prototypeCtx.fillText("Capacity Matrix", 458, 260);
  roundedRect(prototypeCtx, 820, 244, 78, 18, 6, "#dbe8e1");
  roundedRect(prototypeCtx, 904, 244, 78, 18, 6, "#e5ebf3");
  prototypeCtx.fillStyle = "#556860";
  prototypeCtx.font = "600 10px Poppins";
  prototypeCtx.fillText("By Doctor", 839, 257);
  prototypeCtx.fillText("By Room", 925, 257);
  roundedRect(prototypeCtx, 456, 278, 528, 396, 10, "#f7f8f7");
  const cols = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  cols.forEach((col, i) => {
    prototypeCtx.fillStyle = "#6a7b74";
    prototypeCtx.font = "600 12px Poppins";
    prototypeCtx.fillText(col, 492 + i * 101, 300);
  });
  const slots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
  slots.forEach((slot, i) => {
    const y = 320 + i * 56;
    prototypeCtx.fillStyle = "#758680";
    prototypeCtx.font = "500 11px Poppins";
    prototypeCtx.fillText(slot, 468, y + 16);
    for (let j = 0; j < 5; j += 1) {
      const x = 508 + j * 101;
      const fill = 24 + ((i * 17 + j * 11) % 58);
      roundedRect(prototypeCtx, x, y, 84, 40, 6, "#ecefed");
      roundedRect(prototypeCtx, x + 4, y + 24, 76, 8, 4, "#d7dcd9");
      roundedRect(prototypeCtx, x + 4, y + 24, (76 * fill) / 100, 8, 4, fill > 72 ? "#a08579" : fill > 56 ? "#9db3ac" : "#93a49d");
      roundedRect(prototypeCtx, x + 62, y + 6, 18, 12, 4, fill > 72 ? "#f1dfd8" : "#e2ece8");
    }
  });

  roundedRect(prototypeCtx, 1020, 228, 240, 464, 12, "#ffffff");
  prototypeCtx.fillStyle = "#2b4239";
  prototypeCtx.font = "700 18px Poppins";
  prototypeCtx.fillText("Staffing", 1040, 260);
  roundedRect(prototypeCtx, 1166, 244, 76, 18, 6, "#e2e9e6");
  prototypeCtx.fillStyle = "#596b64";
  prototypeCtx.font = "600 10px Poppins";
  prototypeCtx.fillText("Today", 1190, 257);
  const staffing = [
    ["Nurses", 86],
    ["Physicians", 73],
    ["Lab Techs", 64],
    ["Radiology", 58],
    ["Front Desk", 51],
  ];
  staffing.forEach((item, i) => {
    const y = 292 + i * 56;
    prototypeCtx.fillStyle = "#61726b";
    prototypeCtx.font = "600 12px Poppins";
    prototypeCtx.fillText(item[0], 1040, y);
    roundedRect(prototypeCtx, 1040, y + 10, 202, 10, 5, "#e5eae7");
    roundedRect(prototypeCtx, 1040, y + 10, (202 * item[1]) / 100, 10, 5, i % 2 === 0 ? "#8ea39b" : "#9db1aa");
    prototypeCtx.fillStyle = "#55665f";
    prototypeCtx.fillText(`${item[1]}%`, 1206, y);
    roundedRect(prototypeCtx, 1198, y + 26, 44, 14, 5, "#e6ece9");
    prototypeCtx.font = "600 9px Poppins";
    prototypeCtx.fillText("Edit", 1212, y + 36);
  });

  roundedRect(prototypeCtx, 1040, 586, 202, 84, 8, "#f3efec");
  prototypeCtx.fillStyle = "#79665e";
  prototypeCtx.font = "700 12px Poppins";
  prototypeCtx.fillText("Alert: Cardiology queue +19%", 1050, 614);
  prototypeCtx.fillStyle = "#7f726d";
  prototypeCtx.font = "500 11px Poppins";
  prototypeCtx.fillText("Recommendation: open overflow room", 1050, 636);
  roundedRect(prototypeCtx, 1152, 646, 80, 20, 6, "#dfe5e1");
  prototypeCtx.fillStyle = "#50625b";
  prototypeCtx.font = "600 10px Poppins";
  prototypeCtx.fillText("Review", 1176, 660);
  roundedRect(prototypeCtx, 1050, 646, 94, 20, 6, "#d7e5de");
  prototypeCtx.fillStyle = "#4d6159";
  prototypeCtx.fillText("Assign Team", 1072, 660);
}

function drawVaultixScene() {
  const g = prototypeCtx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  g.addColorStop(0, "#f8fbea");
  g.addColorStop(1, "#eef4d8");
  prototypeCtx.fillStyle = g;
  prototypeCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  roundedRect(prototypeCtx, 0, 0, CANVAS_WIDTH, 84, 0, "#ffffff");
  prototypeCtx.fillStyle = "#2e3750";
  prototypeCtx.font = "700 27px Poppins";
  prototypeCtx.fillText("Vaultix Treasury Control", 26, 52);
  prototypeCtx.fillStyle = "#727f9e";
  prototypeCtx.font = "500 13px Poppins";
  prototypeCtx.fillText("Liquidity monitoring, risk signals, and trade execution overview", 26, 72);
  roundedRect(prototypeCtx, 862, 20, 120, 40, 9, "#e8ecf7");
  roundedRect(prototypeCtx, 992, 20, 126, 40, 9, "#dfe7fb");
  roundedRect(prototypeCtx, 1128, 20, 120, 40, 9, "#cfdcf7");
  prototypeCtx.fillStyle = "#566483";
  prototypeCtx.font = "600 12px Poppins";
  prototypeCtx.fillText("Global", 902, 45);
  prototypeCtx.fillText("Last 12h", 1026, 45);
  prototypeCtx.fillText("Auto-Hedge", 1148, 45);

  roundedRect(prototypeCtx, 18, 100, 1242, 116, 12, "#ffffff");
  const kpis = [
    ["Liquidity Ratio", "1.92", "+0.04"],
    ["VaR Exposure", "$8.4M", "-$1.1M"],
    ["Alerts", "7", "3 critical"],
    ["FX Drift", "2.7%", "-0.3%"],
    ["Net Yield", "4.8%", "+0.3%"],
  ];
  kpis.forEach((kpi, i) => {
    const x = 40 + i * 242;
    roundedRect(prototypeCtx, x, 124, 222, 68, 10, "#f5f7fc");
    prototypeCtx.fillStyle = "#6d7896";
    prototypeCtx.font = "600 12px Poppins";
    prototypeCtx.fillText(kpi[0], x + 12, 147);
    prototypeCtx.fillStyle = "#2e3750";
    prototypeCtx.font = "700 23px Poppins";
    prototypeCtx.fillText(kpi[1], x + 12, 174);
    prototypeCtx.fillStyle = "#7f8db0";
    prototypeCtx.font = "600 12px Poppins";
    prototypeCtx.fillText(kpi[2], x + 162, 174);
    prototypeCtx.strokeStyle = i % 2 === 0 ? "#83bbcd" : "#ad95d0";
    prototypeCtx.lineWidth = 2;
    prototypeCtx.beginPath();
    prototypeCtx.moveTo(x + 150, 142);
    prototypeCtx.bezierCurveTo(x + 170, 132 + i * 2, x + 190, 152 - i * 2, x + 210, 140);
    prototypeCtx.stroke();
  });

  roundedRect(prototypeCtx, 18, 232, 280, 460, 12, "#ffffff");
  prototypeCtx.fillStyle = "#2f3a55";
  prototypeCtx.font = "700 18px Poppins";
  prototypeCtx.fillText("Order Book", 38, 264);
  prototypeCtx.fillStyle = "#74809e";
  prototypeCtx.font = "600 11px Poppins";
  prototypeCtx.fillText("PRICE", 38, 286);
  prototypeCtx.fillText("SIZE", 112, 286);
  prototypeCtx.fillText("SIDE", 176, 286);
  prototypeCtx.fillText("DESK", 230, 286);
  for (let i = 0; i < 12; i += 1) {
    const y = 306 + i * 30;
    roundedRect(prototypeCtx, 34, y - 16, 248, 22, 5, i % 2 === 0 ? "#f4f6fb" : "#eef2f9");
    prototypeCtx.fillStyle = i % 2 === 0 ? "#6880b0" : "#8d759c";
    prototypeCtx.font = "500 11px Poppins";
    prototypeCtx.fillText((1.084 + i * 0.0008).toFixed(4), 40, y);
    prototypeCtx.fillStyle = "#6f7a97";
    prototypeCtx.fillText(String(98 + i * 9), 114, y);
    prototypeCtx.fillStyle = i % 2 === 0 ? "#94a87f" : "#b47c6b";
    prototypeCtx.fillText(i % 2 === 0 ? "BID" : "ASK", 178, y);
    prototypeCtx.fillStyle = "#6d7893";
    prototypeCtx.fillText(["EMEA", "AMER", "APAC"][i % 3], 228, y);
    roundedRect(prototypeCtx, 254, y - 10, 24, 8, 4, i % 2 === 0 ? "#dce6fb" : "#f0e6f6");
  }

  roundedRect(prototypeCtx, 314, 232, 640, 322, 12, "#ffffff");
  prototypeCtx.fillStyle = "#2f3a55";
  prototypeCtx.font = "700 18px Poppins";
  prototypeCtx.fillText("Risk Curve", 334, 264);
  roundedRect(prototypeCtx, 770, 246, 70, 18, 6, "#e4e9f7");
  roundedRect(prototypeCtx, 846, 246, 88, 18, 6, "#dce5fb");
  prototypeCtx.fillStyle = "#5d6c8e";
  prototypeCtx.font = "600 10px Poppins";
  prototypeCtx.fillText("VaR", 794, 259);
  prototypeCtx.fillText("Stress Test", 866, 259);
  roundedRect(prototypeCtx, 334, 284, 600, 248, 10, "#f7f8fc");
  prototypeCtx.strokeStyle = "rgba(100,114,150,0.16)";
  prototypeCtx.lineWidth = 1;
  for (let i = 0; i < 6; i += 1) {
    const y = 312 + i * 40;
    prototypeCtx.beginPath();
    prototypeCtx.moveTo(346, y);
    prototypeCtx.lineTo(922, y);
    prototypeCtx.stroke();
  }
  prototypeCtx.strokeStyle = "#83bbcd";
  prototypeCtx.lineWidth = 3;
  prototypeCtx.beginPath();
  prototypeCtx.moveTo(350, 496);
  prototypeCtx.bezierCurveTo(430, 380, 500, 518, 590, 402);
  prototypeCtx.bezierCurveTo(662, 318, 744, 476, 838, 356);
  prototypeCtx.bezierCurveTo(870, 322, 900, 370, 924, 336);
  prototypeCtx.stroke();
  prototypeCtx.strokeStyle = "#ad95d0";
  prototypeCtx.beginPath();
  prototypeCtx.moveTo(350, 514);
  prototypeCtx.bezierCurveTo(438, 440, 506, 544, 602, 460);
  prototypeCtx.bezierCurveTo(678, 394, 760, 516, 842, 430);
  prototypeCtx.bezierCurveTo(876, 396, 904, 436, 924, 410);
  prototypeCtx.stroke();
  roundedRect(prototypeCtx, 846, 300, 78, 22, 6, "#e2e8fa");
  prototypeCtx.fillStyle = "#60709a";
  prototypeCtx.font = "600 10px Poppins";
  prototypeCtx.fillText("Stress +12%", 862, 315);
  prototypeCtx.fillStyle = "#7d89a7";
  prototypeCtx.font = "500 10px Poppins";
  ["08:00", "10:00", "12:00", "14:00", "16:00"].forEach((tick, i) => {
    prototypeCtx.fillText(tick, 352 + i * 112, 526);
  });

  roundedRect(prototypeCtx, 314, 570, 640, 122, 12, "#ffffff");
  prototypeCtx.fillStyle = "#2f3a55";
  prototypeCtx.font = "700 18px Poppins";
  prototypeCtx.fillText("Positions", 334, 602);
  prototypeCtx.fillStyle = "#7884a2";
  prototypeCtx.font = "600 10px Poppins";
  prototypeCtx.fillText("ASSET", 338, 616);
  prototypeCtx.fillText("SIDE", 460, 616);
  prototypeCtx.fillText("SIZE", 566, 616);
  prototypeCtx.fillText("P/L", 664, 616);
  prototypeCtx.fillText("RISK", 736, 616);
  const positions = [
    ["EURUSD", "Long", "3.2M", "+$84K"],
    ["UST 10Y", "Short", "1.1M", "-$22K"],
    ["XAUUSD", "Long", "0.8M", "+$19K"],
    ["JPY Basket", "Short", "2.4M", "-$31K"],
  ];
  positions.forEach((row, i) => {
    const y = 624 + i * 20;
    prototypeCtx.fillStyle = i % 2 === 0 ? "#6b7898" : "#7f8fb2";
    prototypeCtx.font = "500 11px Poppins";
    prototypeCtx.fillText(row[0], 338, y);
    prototypeCtx.fillText(row[1], 460, y);
    prototypeCtx.fillText(row[2], 566, y);
    prototypeCtx.fillStyle = row[3].startsWith("+") ? "#7e9a6f" : "#ab7768";
    prototypeCtx.fillText(row[3], 664, y);
    roundedRect(prototypeCtx, 730, y - 10, 90, 8, 4, "#e2e8f4");
    roundedRect(prototypeCtx, 730, y - 10, 36 + i * 12, 8, 4, i % 2 === 0 ? "#9db0cf" : "#bba8cc");
    roundedRect(prototypeCtx, 832, y - 12, 54, 12, 6, "#e8edf8");
    prototypeCtx.fillStyle = "#5d6a88";
    prototypeCtx.font = "600 9px Poppins";
    prototypeCtx.fillText("Hedge", 848, y - 3);
  });

  roundedRect(prototypeCtx, 970, 232, 290, 460, 12, "#ffffff");
  prototypeCtx.fillStyle = "#2f3a55";
  prototypeCtx.font = "700 18px Poppins";
  prototypeCtx.fillText("Action Panel", 990, 264);
  roundedRect(prototypeCtx, 990, 284, 250, 86, 8, "#f5f7fc");
  prototypeCtx.fillStyle = "#66738f";
  prototypeCtx.font = "600 12px Poppins";
  prototypeCtx.fillText("Desk", 1002, 306);
  prototypeCtx.fillText("Strategy", 1120, 306);
  roundedRect(prototypeCtx, 1002, 316, 104, 36, 7, "#e8edf8");
  roundedRect(prototypeCtx, 1120, 316, 106, 36, 7, "#e8edf8");
  prototypeCtx.fillStyle = "#576685";
  prototypeCtx.font = "600 12px Poppins";
  prototypeCtx.fillText("Global", 1034, 339);
  prototypeCtx.fillText("Risk-Off", 1144, 339);
  roundedRect(prototypeCtx, 1002, 356, 224, 12, 6, "#e6ebf6");
  roundedRect(prototypeCtx, 1002, 356, 138, 12, 6, "#9fb3d9");

  const flags = [
    ["Liquidity gap", "Desk B", "#f1e1db"],
    ["FX drift", "Europe", "#e7e2f3"],
    ["Counterparty load", "APAC", "#e2edf2"],
    ["Volatility breach", "Commodities", "#ecefd9"],
  ];
  flags.forEach((flag, i) => {
    const y = 388 + i * 68;
    roundedRect(prototypeCtx, 990, y, 250, 56, 8, "#f6f8fc");
    roundedRect(prototypeCtx, 1002, y + 16, 10, 24, 4, [ "#b47c6b", "#9a85b3", "#7aa0ad", "#9ea874" ][i]);
    prototypeCtx.fillStyle = "#50607f";
    prototypeCtx.font = "600 12px Poppins";
    prototypeCtx.fillText(flag[0], 1020, y + 30);
    prototypeCtx.fillStyle = "#7a86a4";
    prototypeCtx.font = "500 11px Poppins";
    prototypeCtx.fillText(flag[1], 1020, y + 46);
    roundedRect(prototypeCtx, 1160, y + 14, 66, 24, 7, flag[2]);
    prototypeCtx.fillStyle = "#5d6674";
    prototypeCtx.font = "600 10px Poppins";
    prototypeCtx.fillText("Review", 1178, y + 30);
    roundedRect(prototypeCtx, 1088, y + 14, 64, 24, 7, "#e8edf8");
    prototypeCtx.fillStyle = "#62708e";
    prototypeCtx.fillText("Route", 1108, y + 30);
  });

  roundedRect(prototypeCtx, 990, 664, 118, 22, 7, "#dbe4fa");
  roundedRect(prototypeCtx, 1122, 664, 118, 22, 7, "#cfdcf7");
  prototypeCtx.fillStyle = "#566789";
  prototypeCtx.font = "600 10px Poppins";
  prototypeCtx.fillText("Auto-Rebalance", 1018, 678);
  prototypeCtx.fillText("Hedge Now", 1156, 678);
}

function roundedRect(ctx, x, y, width, height, radius, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
}

function resetPredictionLayer() {
  predictedPoints = [];
  predictionCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  actualCanvas.classList.remove("revealed");
  shareBtn.disabled = true;
  latestScore = null;
  updateCircleCounter();
  setMetrics("-", "-", "-");
  resultMessage.textContent = hasUnlockedPlay
    ? `Place ${MAX_PREDICTION_CIRCLES} circles to begin.`
    : "Enter your work email to unlock the challenge.";
}

function attachDrawHandlers() {
  predictionCanvas.addEventListener("pointerdown", (event) => {
    if (!hasUnlockedPlay) return;
    if (predictedPoints.length >= MAX_PREDICTION_CIRCLES) {
      resultMessage.textContent = `You already placed ${MAX_PREDICTION_CIRCLES} circles. Clear to try again.`;
      return;
    }
    placePredictionCircle(event);
  });
}

function placePredictionCircle(event) {
  const rect = predictionCanvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  const minBound = PREDICTION_RADIUS + 8;
  const maxX = CANVAS_WIDTH - minBound;
  const maxY = CANVAS_HEIGHT - minBound;

  predictedPoints.push({
    x: Math.max(minBound, Math.min(maxX, x)),
    y: Math.max(minBound, Math.min(maxY, y)),
    radius: PREDICTION_RADIUS,
    intensity: PREDICTION_INTENSITY,
  });

  renderPredictionPoints();
  updateCircleCounter();
  if (predictedPoints.length < MAX_PREDICTION_CIRCLES) {
    resultMessage.textContent = `Place ${MAX_PREDICTION_CIRCLES - predictedPoints.length} more circle(s).`;
  } else {
    resultMessage.textContent = `All ${MAX_PREDICTION_CIRCLES} circles placed. Click Score My Prediction.`;
  }
}

function renderPredictionPoints() {
  predictionCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  predictedPoints.forEach((point, index) => {
    const color = THEME_SWATCHES[index % THEME_SWATCHES.length];
    const gradient = predictionCtx.createRadialGradient(point.x, point.y, 0, point.x, point.y, point.radius);
    gradient.addColorStop(0, hexToRgba(color, 0.42));
    gradient.addColorStop(0.55, hexToRgba(color, 0.24));
    gradient.addColorStop(1, hexToRgba(color, 0));
    predictionCtx.globalCompositeOperation = "lighter";
    predictionCtx.fillStyle = gradient;
    predictionCtx.beginPath();
    predictionCtx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    predictionCtx.fill();

    predictionCtx.globalCompositeOperation = "source-over";
    predictionCtx.strokeStyle = hexToRgba(color, 0.75);
    predictionCtx.lineWidth = 2;
    predictionCtx.beginPath();
    predictionCtx.arc(point.x, point.y, point.radius * 0.7, 0, Math.PI * 2);
    predictionCtx.stroke();

    predictionCtx.fillStyle = "#2a1a0f";
    predictionCtx.font = "600 15px Poppins";
    predictionCtx.fillText(String(index + 1), point.x - 4, point.y + 5);
  });
}

function updateCircleCounter() {
  if (!circleCounter) return;
  const remaining = Math.max(0, MAX_PREDICTION_CIRCLES - predictedPoints.length);
  circleCounter.textContent = `Heat Circles left: ${remaining}`;
}

function attachActions() {
  clearBtn.addEventListener("click", resetPredictionLayer);

  submitBtn.addEventListener("click", () => {
    if (!hasUnlockedPlay) {
      resultMessage.textContent = "Enter your work email to unlock the challenge.";
      return;
    }

    if (!heatmapData) {
      resultMessage.textContent = "Heatmap data is not available.";
      return;
    }

    if (predictedPoints.length !== MAX_PREDICTION_CIRCLES) {
      resultMessage.textContent = `Place all ${MAX_PREDICTION_CIRCLES} circles before scoring.`;
      return;
    }

    const score = scoreCirclePredictions(predictedPoints, heatmapData.points);

    latestScore = score;
    setMetrics(`${score.accuracy.toFixed(1)}%`, `${score.overlap.toFixed(1)}%`, `${score.miss.toFixed(1)}%`);
    resultMessage.textContent = buildScoreMessage(score.accuracy);
    if (score.accuracy > 75) {
      launchConfetti();
    }

    drawActualHeatmap(heatmapData.points, { reveal: true });
    shareBtn.disabled = false;
  });

  shareBtn.addEventListener("click", async () => {
    if (!latestScore) return;

    const dataUrl = buildShareCard(latestScore);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Defeat the Heat",
          text: `I scored ${latestScore.accuracy.toFixed(1)}% in #DefeatTheHeat. Can you beat me?`,
          url: window.location.href,
        });
      } catch (error) {
        console.debug("Share canceled or unavailable", error);
      }
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "defeat-the-heat-score.png";
    link.click();
  });

  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!latestScore) {
      resultMessage.textContent = "Submit your prediction before saving your score.";
      return;
    }

    const name = playerNameInput.value.trim();
    if (!name) return;

    saveLeaderboardScore({
      name,
      score: Number(latestScore.accuracy.toFixed(1)),
      createdAt: Date.now(),
    });

    playerNameInput.value = "";
    renderLeaderboard();
  });
}

function attachEmailGate() {
  emailGateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = workEmailInput.value.trim();
    if (!isValidWorkEmail(email)) {
      resultMessage.textContent = "Please enter a valid work email to play.";
      return;
    }

    hasUnlockedPlay = true;
    setPlayLockState(false);
    resultMessage.textContent = `Great. Place ${MAX_PREDICTION_CIRCLES} circles to begin.`;
  });
}

function setPlayLockState(locked) {
  predictionCanvas.classList.toggle("locked", locked);
  predictionCanvas.style.pointerEvents = locked ? "none" : "auto";
  clearBtn.disabled = locked;
  submitBtn.disabled = locked;
  if (startBtn) {
    startBtn.disabled = !locked;
  }
  if (workEmailInput) {
    workEmailInput.readOnly = !locked;
  }
}

function isValidWorkEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function drawActualHeatmap(points, { reveal }) {
  actualCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  points.forEach((point) => {
    const radius = point.radius;
    const gradient = actualCtx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    gradient.addColorStop(0, `rgba(255, 72, 66, ${point.intensity * 0.95})`);
    gradient.addColorStop(0.45, `rgba(255, 166, 61, ${point.intensity * 0.72})`);
    gradient.addColorStop(0.8, `rgba(255, 234, 88, ${point.intensity * 0.42})`);
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

    actualCtx.globalCompositeOperation = "lighter";
    actualCtx.fillStyle = gradient;
    actualCtx.beginPath();
    actualCtx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    actualCtx.fill();
  });

  if (reveal) {
    actualCanvas.classList.add("revealed");
  }
}

function pointsToGrid(points) {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

  points.forEach((point) => {
    const radiusCellsX = Math.ceil(point.radius / CELL_W);
    const radiusCellsY = Math.ceil(point.radius / CELL_H);
    const cx = Math.floor(point.x / CELL_W);
    const cy = Math.floor(point.y / CELL_H);

    for (let y = cy - radiusCellsY; y <= cy + radiusCellsY; y += 1) {
      if (y < 0 || y >= GRID_SIZE) continue;
      for (let x = cx - radiusCellsX; x <= cx + radiusCellsX; x += 1) {
        if (x < 0 || x >= GRID_SIZE) continue;
        const px = x * CELL_W + CELL_W / 2;
        const py = y * CELL_H + CELL_H / 2;
        const distance = Math.hypot(px - point.x, py - point.y);
        if (distance > point.radius) continue;

        const influence = (1 - distance / point.radius) * point.intensity;
        grid[y][x] += influence;
      }
    }
  });

  return normalizeGrid(grid);
}

function scoreCirclePredictions(predicted, actual) {
  if (!predicted.length || !actual.length) {
    return { accuracy: 0, overlap: 0, miss: 100 };
  }

  const n = Math.min(predicted.length, actual.length);
  const actualIndices = Array.from({ length: n }, (_, i) => i);
  let bestAssignmentSimilarity = -1;

  permute(actualIndices, 0, (perm) => {
    let sum = 0;
    for (let i = 0; i < n; i += 1) {
      const p = predicted[i];
      const a = actual[perm[i]];
      sum += circleSimilarity(p, a);
    }
    if (sum > bestAssignmentSimilarity) {
      bestAssignmentSimilarity = sum;
    }
  });

  // Coverage by actual hotspot: did player place a circle near each true hotspot.
  let hotspotCoverageSum = 0;
  for (let i = 0; i < n; i += 1) {
    let bestForActual = 0;
    for (let j = 0; j < n; j += 1) {
      const sim = circleSimilarity(predicted[j], actual[i]);
      if (sim > bestForActual) bestForActual = sim;
    }
    hotspotCoverageSum += bestForActual;
  }

  const assignmentScore = (bestAssignmentSimilarity / n) * 100;
  const overlap = (hotspotCoverageSum / n) * 100;
  const accuracy = Math.max(0, Math.min(100, assignmentScore * 0.82 + overlap * 0.18));
  const miss = Math.max(0, 100 - overlap);

  return { accuracy, overlap, miss };
}

function circleSimilarity(predictedCircle, actualCircle) {
  const distance = Math.hypot(predictedCircle.x - actualCircle.x, predictedCircle.y - actualCircle.y);
  const tolerance = Math.max(80, actualCircle.radius * 1.15);
  return Math.max(0, 1 - distance / tolerance);
}

function permute(arr, start, visit) {
  if (start === arr.length - 1) {
    visit(arr);
    return;
  }
  for (let i = start; i < arr.length; i += 1) {
    [arr[start], arr[i]] = [arr[i], arr[start]];
    permute(arr, start + 1, visit);
    [arr[start], arr[i]] = [arr[i], arr[start]];
  }
}

function normalizeGrid(grid) {
  let max = 0;
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (grid[y][x] > max) max = grid[y][x];
    }
  }

  if (max <= 0) return grid;

  return grid.map((row) => row.map((value) => value / max));
}

function buildScoreMessage(accuracy) {
  if (accuracy >= 88) {
    return "Elite read. You spotted the friction before the data did.";
  }
  if (accuracy >= 75) {
    return "Strong instincts. You defeated the heat.";
  }
  if (accuracy >= 55) {
    return "Close. You found some hotspots, but users surprised you.";
  }
  return "Users zigged while you zagged. Try another prediction.";
}

function setMetrics(accuracy, overlap, miss) {
  accuracyValue.textContent = accuracy;
  overlapValue.textContent = overlap;
  missValue.textContent = miss;
}

function launchConfetti() {
  const colors = ["#ad95d0", "#ff733a", "#83bbcd", "#ced255", "#2f3136"];
  const pieces = 120;
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  for (let i = 0; i < pieces; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 260}px`);
    piece.style.setProperty("--dur", `${2.2 + Math.random() * 1.6}s`);
    piece.style.setProperty("--delay", `${Math.random() * 0.25}s`);
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(piece);
  }

  window.setTimeout(() => {
    container.remove();
  }, 4200);
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => char + char)
        .join("")
    : normalized;
  const int = Number.parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildShareCard(score) {
  const shareCanvas = document.createElement("canvas");
  shareCanvas.width = 1200;
  shareCanvas.height = 630;
  const ctx = shareCanvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, shareCanvas.width, shareCanvas.height);
  bg.addColorStop(0, "#fff8ef");
  bg.addColorStop(1, "#f2e5d8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, shareCanvas.width, shareCanvas.height);

  ctx.fillStyle = "rgba(255,122,47,0.2)";
  ctx.beginPath();
  ctx.arc(220, 130, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(38,42,51,0.16)";
  ctx.beginPath();
  ctx.arc(1050, 500, 170, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1d1f24";
  ctx.font = "700 62px Avenir Next";
  ctx.fillText("Defeat the Heat", 72, 152);

  ctx.font = "600 30px Avenir Next";
  ctx.fillStyle = "#ff7a2f";
  ctx.fillText(`Score: ${score.accuracy.toFixed(1)}%`, 72, 230);

  ctx.font = "500 30px Avenir Next";
  ctx.fillStyle = "#5f5850";
  ctx.fillText(`Overlap ${score.overlap.toFixed(1)}%   |   Misses ${score.miss.toFixed(1)}%`, 72, 282);

  ctx.font = "600 24px Avenir Next";
  ctx.fillStyle = "#4f4943";
  ctx.fillText(`Scenario: ${DASHBOARD_SCENARIOS[activeDashboardId].name}`, 72, 332);

  ctx.font = "600 28px Avenir Next";
  ctx.fillStyle = "#262a33";
  ctx.fillText("Can you beat me? #DefeatTheHeat", 72, 490);

  ctx.fillStyle = "#1d1f24";
  ctx.font = "700 34px Avenir Next";
  ctx.fillText("Defeat the Heat Challenge", 72, 548);

  return shareCanvas.toDataURL("image/png");
}

function getLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLeaderboardScore(entry) {
  const current = getLeaderboard();
  const updated = [...current, entry]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.createdAt - b.createdAt;
    })
    .slice(0, 10);

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
}

function renderLeaderboard() {
  const items = getLeaderboard();
  leaderboardEl.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "leaderboard-item";
    empty.textContent = "No scores yet.";
    leaderboardEl.append(empty);
    return;
  }

  items.forEach((item, index) => {
    const node = leaderboardTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".lb-name").textContent = `${index + 1}. ${item.name}`;
    node.querySelector(".lb-score").textContent = `${item.score.toFixed(1)}%`;
    leaderboardEl.append(node);
  });
}
