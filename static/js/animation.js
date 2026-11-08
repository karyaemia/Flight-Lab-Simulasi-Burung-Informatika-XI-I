/*
  FRONTEND SIMULASI BURUNG
  - Mengambil hasil hitung dari backend Python (Flask).
  - Menggambar lintasan dan karakter Boro dengan Canvas.
  - Menyediakan mode Soal 1, Lab Bebas, Bandingkan Sudut, dan Tantangan.
*/

const canvas = document.getElementById("flightCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  angle: document.getElementById("angleInput"),
  speed: document.getElementById("speedInput"),
  gravity: document.getElementById("gravityInput"),
  launchHeight: document.getElementById("launchHeightInput"),
  target: document.getElementById("targetInput"),
  angleOut: document.getElementById("angleOutput"),
  speedOut: document.getElementById("speedOutput"),
  gravityOut: document.getElementById("gravityOutput"),
  launchHeightOut: document.getElementById("launchHeightOutput"),
  targetOut: document.getElementById("targetOutput"),
  range: document.getElementById("rangeValue"),
  height: document.getElementById("heightValue"),
  time: document.getElementById("timeValue"),
  vx: document.getElementById("vxValue"),
  stageMode: document.getElementById("stageMode"),
  modeDescription: document.getElementById("modeDescription"),
  fixedGravity: document.getElementById("fixedGravity"),
  challengeResult: document.getElementById("challengeResult"),
  compareSection: document.getElementById("compareSection"),
  comparisonBody: document.getElementById("comparisonBody"),
  calculation: document.getElementById("calculationLine"),
  callout: document.getElementById("calloutText"),
  insightTitle: document.getElementById("insightTitle"),
  insightText: document.getElementById("insightText"),
};

const DEFAULT_CHARACTER_COLORS = {
  body: "#2bae9f",
  wing: "#76d8c7",
  accessory: "#6256d9",
  accent: "#f27d6b",
  beak: "#f4b64d",
  feet: "#d58a52",
};

const CHARACTER_PALETTES = {
  flightlab: { ...DEFAULT_CHARACTER_COLORS },
  ocean: {
    body: "#3b8fc4", wing: "#8fd2ea", accessory: "#245d9f",
    accent: "#f4b64d", beak: "#f7c45a", feet: "#b87949",
  },
  sunset: {
    body: "#e78a69", wing: "#f7b69a", accessory: "#8b5fbf",
    accent: "#f5c35d", beak: "#efb64f", feet: "#a86b4d",
  },
  forest: {
    body: "#5dad79", wing: "#a5d7a2", accessory: "#46785b",
    accent: "#f3c45c", beak: "#e9b64f", feet: "#996a47",
  },
};

const state = {
  mode: "assignment",
  result: null,
  comparisons: [],
  progress: 0,
  playing: false,
  showTrail: true,
  lastFrame: 0,
  scale: null,
  zoom: 1,
  playbackRate: 1,
  direction: 1,
  costume: "classic",
  colors: { ...DEFAULT_CHARACTER_COLORS },
};

const previewCanvas = document.getElementById("lessonPreviewCanvas");
const previewCtx = previewCanvas ? previewCanvas.getContext("2d") : null;
const previewState = {
  result: null,
  treeHeight: null,
  progress: 0,
  playing: false,
  lastFrame: 0,
  playbackRate: 1,
  direction: 1,
  zoom: 1,
};

let simulationRequestId = 0;
let comparisonRequestId = 0;

const ANGLE_COLORS = ["#ed7a75", "#f0a64f", "#6c66d9", "#20a997", "#4b9acb", "#a77acb"];

function params() {
  return {
    angle: Number(ui.angle.value),
    speed: Number(ui.speed.value),
    gravity: state.mode === "assignment" || state.mode === "challenge" || state.mode === "compare"
      ? 10 : Number(ui.gravity.value),
    launch_height: state.mode === "lab" ? Number(ui.launchHeight.value) : 0,
  };
}

function format(value, digits = 2) {
  if (!Number.isFinite(value)) return "0";
  return Number(value).toFixed(digits);
}

function updateLabels() {
  ui.angleOut.textContent = `${ui.angle.value}°`;
  ui.speedOut.textContent = `${ui.speed.value} m/s`;
  ui.gravityOut.textContent = `${Number(ui.gravity.value).toFixed(2)} m/s²`;
  ui.launchHeightOut.textContent = `${ui.launchHeight.value} m`;
  ui.targetOut.textContent = `${ui.target.value} m`;
}

async function postJSON(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || "Gagal menghitung simulasi.");
  return data;
}

async function refreshSimulation(autoplay = false) {
  updateLabels();
  const requestId = ++simulationRequestId;
  try {
    const data = await postJSON("/api/simulate", params());
    // Abaikan respons lama jika slider sudah mengirim permintaan yang lebih baru.
    if (requestId !== simulationRequestId) return;

    state.result = data.result;
    state.progress = 0;
    state.direction = 1;
    state.lastFrame = 0;
    state.zoom = 1; // Input baru selalu kembali ke seluruh lintasan (Auto Fit).
    state.playing = Boolean(autoplay && data.result.flight_time > 0);
    renderMetrics();

    if (state.mode === "compare") await refreshComparison();
    if (requestId !== simulationRequestId) return;

    drawScene();
    updateZoomReadout();
  } catch (error) {
    if (requestId === simulationRequestId) {
      state.playing = false;
      ui.callout.textContent = error.message;
    }
  }
}
async function refreshComparison() {
  const requestId = ++comparisonRequestId;
  const data = await postJSON("/api/compare", {
    speed: Number(ui.speed.value),
    gravity: 10,
    launch_height: 0,
  });
  if (requestId !== comparisonRequestId) return;
  state.comparisons = data.results;
  renderComparison();
  drawScene();
}
function renderMetrics() {
  const r = state.result;
  if (!r) return;
  ui.range.textContent = format(r.range, 1);
  ui.height.textContent = format(r.max_height, 2);
  ui.time.textContent = format(r.flight_time, 3);
  ui.vx.textContent = format(r.vx, 2);

  const angle = Number(r.angle);
  const speed = Number(r.speed);
  const g = Number(r.gravity);
  const radians = angle * Math.PI / 180;
  const range = r.range;

  if (state.mode === "assignment") {
    ui.calculation.textContent =
      `R = (${speed}² × sin(${2 * angle}°)) / 10 = ${format(range, 1)} m`;
    ui.callout.textContent = "Simulasi umum: amati lintasan gerak parabola Boro.";
    ui.insightTitle.textContent = "Sudut dan jarak";
    ui.insightText.textContent =
      "Pada kondisi ideal dengan titik awal dan akhir setinggi sama, sudut 45° menghasilkan jarak terjauh untuk kecepatan awal yang sama.";
  } else if (state.mode === "lab") {
    ui.calculation.textContent =
      `Vx = ${format(r.vx, 2)} m/s · Vy = ${format(r.vy, 2)} m/s · g = ${format(g, 2)} m/s²`;
    ui.callout.textContent = "Lab bebas: ubah gravitasi dan tinggi awal.";
    ui.insightTitle.textContent = "Eksperimen gravitasi";
    ui.insightText.textContent =
      "Gravitasi yang lebih kecil membuat benda berada lebih lama di udara. Tinggi peluncuran juga dapat menambah waktu dan jarak.";
  } else if (state.mode === "compare") {
    ui.calculation.textContent = `Membandingkan 6 sudut dengan V = ${speed} m/s dan g = 10 m/s².`;
    ui.callout.textContent = "Mode bandingkan: amati bentuk setiap lintasan.";
    ui.insightTitle.textContent = "Cari sudut terbaik";
    ui.insightText.textContent =
      "Untuk peluncuran dan pendaratan pada ketinggian yang sama, jarak ideal maksimum terjadi di sekitar 45°.";
  } else {
    const target = Number(ui.target.value);
    const difference = range - target;
    const close = Math.abs(difference) <= Math.max(1, target * 0.05);
    ui.challengeResult.classList.remove("hidden");
    ui.challengeResult.textContent = close
      ? `🎯 Tepat sasaran! Jarak ${format(range, 1)} m dekat dengan target ${target} m.`
      : difference < 0
        ? `↗ Kurang jauh ${format(Math.abs(difference), 1)} m. Naikkan kecepatan atau ubah sudut.`
        : `↘ Terlalu jauh ${format(difference, 1)} m. Coba sesuaikan sudut atau kecepatan.`;
    ui.calculation.textContent = `Jarak aktual ${format(range, 1)} m · target ${target} m`;
    ui.callout.textContent = close ? "Boro mencapai target!" : "Coba lagi, pilot!";
    ui.insightTitle.textContent = "Misi mencapai target";
    ui.insightText.textContent =
      "Atur sudut dan kecepatan agar jarak horizontal sedekat mungkin dengan target. Toleransi keberhasilan adalah 5% atau minimal 1 meter.";
  }
}

function renderComparison() {
  ui.comparisonBody.innerHTML = "";
  if (!state.comparisons.length) return;
  const best = state.comparisons.reduce((a, b) => a.range > b.range ? a : b);
  state.comparisons.forEach((item) => {
    const row = document.createElement("tr");
    if (item.angle === best.angle) row.className = "best-row";
    row.innerHTML = `
      <td>${item.angle}° ${item.angle === best.angle ? "★" : ""}</td>
      <td>${format(item.range, 2)} m</td>
      <td>${format(item.max_height, 2)} m</td>
      <td>${format(item.flight_time, 3)} s</td>`;
    ui.comparisonBody.appendChild(row);
  });
}

function setMode(mode) {
  state.mode = mode;
  state.progress = 0;
  state.playing = false;

  document.querySelectorAll(".mode-tab").forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  document.querySelectorAll(".lab-only").forEach(el =>
    el.classList.toggle("hidden", mode !== "lab"));
  document.querySelectorAll(".challenge-only").forEach(el =>
    el.classList.toggle("hidden", mode !== "challenge"));
  ui.fixedGravity.classList.toggle("hidden", mode === "lab");
  ui.compareSection.classList.toggle("hidden", mode !== "compare");
  ui.challengeResult.classList.toggle("hidden", mode !== "challenge");

  const descriptions = {
    assignment: {
      title: "Mode simulasi umum",
      text: "Atur sudut dan kecepatan sendiri. Gravitasi tetap 10 m/s² untuk model tugas sekolah.",
      badge: "SIMULASI UMUM",
    },
    lab: {
      title: "Mode eksplorasi bebas",
      text: "Ubah gravitasi planet dan tinggi awal untuk melihat perbedaan gerak.",
      badge: "FREE LAB",
    },
    compare: {
      title: "Mode perbandingan sudut",
      text: "Bandingkan enam sudut dengan kecepatan yang sama.",
      badge: "ANGLE STUDY",
    },
    challenge: {
      title: "Mode tantangan target",
      text: "Atur sudut dan kecepatan untuk mendarat sedekat mungkin dengan target.",
      badge: "CHALLENGE",
    },
  };
  const desc = descriptions[mode];
  ui.modeDescription.innerHTML = `<strong>${desc.title}</strong><span>${desc.text}</span>`;
  ui.stageMode.textContent = desc.badge;

  if (mode === "assignment" || mode === "challenge" || mode === "compare") {
    ui.gravity.value = "10";
    ui.launchHeight.value = "0";
  }
  refreshSimulation(false);
}

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Perubahan ukuran layar mengembalikan kamera ke Auto Fit agar tidak terpotong.
  state.zoom = 1;
  drawScene();
  updateZoomReadout();
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawCloud(x, y, scale = 1, context = ctx) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.fillStyle = "rgba(255,255,255,.82)";
  context.beginPath();
  context.arc(0, 9, 14, 0, Math.PI * 2);
  context.arc(15, 0, 19, 0, Math.PI * 2);
  context.arc(34, 9, 14, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawSlingshot(x, groundY, context = ctx, scale = 1) {
  context.save();
  context.translate(x, groundY);
  context.scale(scale, scale);
  context.lineCap = "round";
  context.strokeStyle = "#79523f";
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(-2, -2); context.lineTo(-2, -44);
  context.moveTo(-2, -42); context.lineTo(-20, -67);
  context.moveTo(-2, -42); context.lineTo(17, -70);
  context.stroke();
  context.strokeStyle = "#c28a5e";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-5, -4); context.lineTo(-5, -43);
  context.moveTo(-5, -43); context.lineTo(-22, -67);
  context.moveTo(-5, -43); context.lineTo(15, -70);
  context.stroke();
  context.restore();
}

function drawWatermelon(x, y, scale = 1, context = ctx) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.fillStyle = "#288b5c";
  context.strokeStyle = "#176c4c";
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(0, 9, 17, 9, -0.12, 0, Math.PI * 2);
  context.fill(); context.stroke();
  context.strokeStyle = "#9be17a";
  context.lineWidth = 2;
  [-9, -3, 4, 10].forEach(offset => {
    context.beginPath();
    context.moveTo(offset, 2);
    context.quadraticCurveTo(offset - 3, 9, offset, 16);
    context.stroke();
  });
  context.restore();
}

function mixHex(hexA, hexB, amount) {
  const parse = hex => {
    const clean = String(hex || "#000000").replace("#", "");
    const full = clean.length === 3 ? clean.split("").map(ch => ch + ch).join("") : clean;
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16) || 0);
  };
  const a = parse(hexA);
  const b = parse(hexB);
  const t = Math.max(0, Math.min(1, amount));
  return "#" + a.map((value, index) =>
    Math.round(value * (1 - t) + b[index] * t).toString(16).padStart(2, "0")
  ).join("");
}

function drawBoro(x, y, scale = 1, tilt = 0, context = ctx) {
  const costume = state.costume || "classic";
  const colors = state.colors;
  const bodyDark = mixHex(colors.body, "#173e45", .42);
  const wingDark = mixHex(colors.wing, bodyDark, .34);
  const outfitDark = mixHex(colors.accessory, "#222047", .34);
  const accentLight = mixHex(colors.accent, "#ffffff", .22);

  context.save();
  context.translate(x, y);
  context.rotate(tilt);
  context.scale(scale, scale);

  // Bayangan dan alas semangka: konsisten pada simulasi utama dan pratinjau.
  drawWatermelon(0, 17, .92, context);
  context.fillStyle = "rgba(35,61,72,.13)";
  context.beginPath();
  context.ellipse(0, 29, 20, 4, 0, 0, Math.PI * 2);
  context.fill();

  // Ekor menggunakan turunan warna bulu, bukan warna acak.
  context.fillStyle = bodyDark;
  context.beginPath();
  context.moveTo(-13, -7);
  context.quadraticCurveTo(-28, -19, -29, -8);
  context.quadraticCurveTo(-25, 2, -12, 2);
  context.closePath();
  context.fill();

  // Badan utama dengan gradasi yang selalu mengikuti warna pilihan.
  const bodyGradient = context.createLinearGradient(-14, -25, 15, 17);
  bodyGradient.addColorStop(0, mixHex(colors.body, "#ffffff", .34));
  bodyGradient.addColorStop(.58, colors.body);
  bodyGradient.addColorStop(1, mixHex(colors.body, "#173e45", .28));
  context.fillStyle = bodyGradient;
  context.strokeStyle = bodyDark;
  context.lineWidth = 1.8;
  context.beginPath();
  context.ellipse(0, -5, 17, 21, -.12, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  // Sayap, garis bulu, dan highlight mengikuti palet yang dipilih.
  context.fillStyle = colors.wing;
  context.strokeStyle = wingDark;
  context.lineWidth = 1.5;
  context.beginPath();
  context.ellipse(-10, 1, 8, 11, -.58, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = mixHex(colors.wing, bodyDark, .48);
  context.lineWidth = 1.1;
  for (let i = 0; i < 3; i++) {
    context.beginPath();
    context.moveTo(-14 + i * 2, -2 + i * 2);
    context.quadraticCurveTo(-9 + i * 2, 5 + i * 2, -5 + i, 7 + i);
    context.stroke();
  }
  context.fillStyle = "rgba(255,255,255,.24)";
  context.beginPath();
  context.ellipse(-6, -16, 6, 4, -.4, 0, Math.PI * 2);
  context.fill();

  // Kaki dan jari.
  context.strokeStyle = colors.feet;
  context.lineWidth = 2.4;
  context.lineCap = "round";
  [-5, 5].forEach(offset => {
    context.beginPath();
    context.moveTo(offset, 12);
    context.lineTo(offset + 1, 19);
    context.moveTo(offset + 1, 19);
    context.lineTo(offset - 4, 21);
    context.moveTo(offset + 1, 19);
    context.lineTo(offset + 6, 21);
    context.stroke();
  });

  // Mata, alis, dan pipi.
  context.fillStyle = "#fffdf7";
  context.beginPath();
  context.ellipse(7, -11, 6.2, 7.3, -.12, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#28334f";
  context.beginPath();
  context.arc(9, -10, 2.8, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(10, -11, 1, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = bodyDark;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(2, -20);
  context.quadraticCurveTo(7, -23, 12, -20);
  context.stroke();
  context.fillStyle = accentLight;
  context.beginPath();
  context.ellipse(10, -2, 4, 2.5, 0, 0, Math.PI * 2);
  context.fill();

  // Paruh.
  context.fillStyle = colors.beak;
  context.strokeStyle = mixHex(colors.beak, "#70452b", .32);
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(15, -7);
  context.quadraticCurveTo(27, -5, 23, 1);
  context.quadraticCurveTo(20, 4, 14, 0);
  context.closePath();
  context.fill();
  context.stroke();

  // Jambul dasar.
  context.fillStyle = colors.accent;
  context.beginPath();
  context.moveTo(-7, -23);
  context.quadraticCurveTo(-13, -34, -3, -28);
  context.quadraticCurveTo(0, -37, 3, -26);
  context.quadraticCurveTo(10, -33, 8, -22);
  context.closePath();
  context.fill();

  // Kostum. Semua aksesori memakai warna kostum/aksen yang dapat diubah.
  if (costume === "pilot") {
    context.fillStyle = colors.accessory;
    context.strokeStyle = outfitDark;
    context.lineWidth = 1.5;
    context.beginPath();
    context.ellipse(0, -25, 14, 6, -.08, Math.PI, Math.PI * 2);
    context.lineTo(13, -22);
    context.quadraticCurveTo(0, -19, -13, -22);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = colors.accent;
    context.fillRect(-10, -22, 20, 3);
    context.strokeStyle = colors.beak;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(8, -17, 4, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "rgba(255,255,255,.45)";
    context.beginPath();
    context.arc(8, -17, 2.2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = colors.accent;
    context.beginPath();
    context.moveTo(-14, 4); context.lineTo(-5, 8); context.lineTo(-12, 13); context.closePath();
    context.fill();
  } else if (costume === "explorer") {
    context.fillStyle = colors.accessory;
    context.strokeStyle = outfitDark;
    context.lineWidth = 1.5;
    context.beginPath();
    context.ellipse(-1, -25, 17, 4, -.04, 0, Math.PI * 2);
    context.fill(); context.stroke();
    context.beginPath();
    context.ellipse(-1, -29, 10, 6, -.08, Math.PI, Math.PI * 2);
    context.fill(); context.stroke();
    context.fillStyle = colors.accent;
    context.fillRect(-13, -27, 24, 2.5);
    context.fillStyle = colors.accessory;
    roundedRect(context, -20, -2, 7, 13, 3);
    context.fill();
    context.fillStyle = colors.beak;
    context.beginPath(); context.arc(-13, 7, 2, 0, Math.PI * 2); context.fill();
  } else if (costume === "royal") {
    context.fillStyle = colors.accessory;
    context.beginPath();
    context.moveTo(-13, 2); context.lineTo(-19, 17); context.lineTo(2, 14); context.lineTo(15, 4);
    context.closePath();
    context.fill();
    context.strokeStyle = outfitDark;
    context.lineWidth = 1;
    context.stroke();
    context.fillStyle = colors.beak;
    context.strokeStyle = mixHex(colors.beak, "#5a3b20", .25);
    context.beginPath();
    context.moveTo(-11, -24);
    context.lineTo(-10, -35);
    context.lineTo(-3, -29);
    context.lineTo(2, -38);
    context.lineTo(7, -29);
    context.lineTo(13, -34);
    context.lineTo(12, -23);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = colors.accent;
    context.beginPath(); context.arc(1, -29, 2.2, 0, Math.PI * 2); context.fill();
  } else if (costume === "astronaut") {
    context.strokeStyle = colors.accessory;
    context.lineWidth = 3;
    context.beginPath(); context.arc(0, -8, 22, Math.PI * 1.08, Math.PI * 1.92); context.stroke();
    context.fillStyle = "rgba(255,255,255,.5)";
    context.strokeStyle = colors.accessory;
    context.lineWidth = 1.5;
    context.beginPath(); context.ellipse(8, -12, 10, 8, -.12, 0, Math.PI * 2); context.fill(); context.stroke();
    context.fillStyle = colors.accent;
    context.beginPath(); context.arc(-2, 5, 3, 0, Math.PI * 2); context.fill();
    context.fillStyle = colors.accessory;
    roundedRect(context, -20, -2, 6, 15, 3); context.fill();
    context.strokeStyle = colors.beak;
    context.lineWidth = 2;
    context.beginPath(); context.moveTo(-3, -29); context.lineTo(-3, -36); context.stroke();
    context.fillStyle = colors.accent;
    context.beginPath(); context.arc(-3, -37, 2, 0, Math.PI * 2); context.fill();
  } else if (costume === "scientist") {
    context.fillStyle = colors.accessory;
    context.strokeStyle = outfitDark;
    context.lineWidth = 1.4;
    context.beginPath();
    context.ellipse(-1, -25, 15, 5, 0, Math.PI, Math.PI * 2);
    context.lineTo(12, -22); context.lineTo(-14, -22); context.closePath();
    context.fill(); context.stroke();
    context.strokeStyle = colors.accent;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(7, -11, 7.8, -.95, .95);
    context.stroke();
    context.fillStyle = colors.accent;
    roundedRect(context, -2, 5, 7, 6, 2); context.fill();
    context.fillStyle = colors.beak;
    context.beginPath(); context.arc(1.5, 8, 1.2, 0, Math.PI * 2); context.fill();
  } else if (costume === "gardener") {
    context.fillStyle = colors.accessory;
    context.strokeStyle = outfitDark;
    context.lineWidth = 1.4;
    context.beginPath();
    context.ellipse(-1, -25, 18, 4, 0, 0, Math.PI * 2); context.fill(); context.stroke();
    context.beginPath();
    context.ellipse(-1, -30, 10, 6, 0, Math.PI, Math.PI * 2); context.fill(); context.stroke();
    context.fillStyle = colors.accent;
    context.beginPath();
    context.ellipse(-2, -31, 3, 6, -.65, 0, Math.PI * 2); context.fill();
    context.fillStyle = colors.accessory;
    roundedRect(context, -19, 0, 7, 12, 3); context.fill();
    context.strokeStyle = colors.accent;
    context.lineWidth = 2;
    context.beginPath(); context.moveTo(-14, 3); context.lineTo(-10, -2); context.stroke();
  } else if (costume === "racer") {
    context.fillStyle = colors.accessory;
    context.strokeStyle = outfitDark;
    context.lineWidth = 1.5;
    context.beginPath();
    context.ellipse(0, -24, 15, 8, -.08, Math.PI, Math.PI * 2);
    context.lineTo(14, -20); context.quadraticCurveTo(0, -16, -14, -20);
    context.closePath(); context.fill(); context.stroke();
    context.fillStyle = colors.accent;
    context.fillRect(-11, -23, 22, 2.5);
    context.fillStyle = "rgba(255,255,255,.52)";
    context.fillRect(4, -28, 7, 3);
    context.fillStyle = colors.accessory;
    context.beginPath();
    context.moveTo(-14, 5); context.lineTo(-3, 9); context.lineTo(-12, 15); context.closePath(); context.fill();
    context.fillStyle = colors.beak;
    context.font = "bold 7px Consolas, monospace";
    context.fillText("1", -3, 13);
  }

  context.restore();
}

function worldToScreen(x, y, scale) {
  return {
    x: scale.left + x * scale.factor,
    y: scale.ground - y * scale.factor,
  };
}

function getTrajectoryBounds(results, targetX = 0, extraHeight = 0) {
  const valid = (results || []).filter(Boolean);
  const finiteNonNegative = value => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : 0;
  };
  const maxX = Math.max(
    1,
    finiteNonNegative(targetX),
    ...valid.map(item => finiteNonNegative(item.range))
  );
  const maxY = Math.max(
    1,
    finiteNonNegative(extraHeight),
    ...valid.map(item => Math.max(
      finiteNonNegative(item.max_height),
      finiteNonNegative(item.launch_height)
    ))
  );
  return { maxX, maxY };
}

function fitScale(width, height, bounds, margins, zoom = 1, objectPadding = {}) {
  // Sisakan ruang piksel untuk badan, jambul, paruh, ketapel, dan label.
  // Ini mencegah karakter terpotong saat lintasan sangat tinggi atau sangat jauh.
  const reserveX = Number.isFinite(objectPadding.x) ? objectPadding.x : 38;
  const reserveY = Number.isFinite(objectPadding.y) ? objectPadding.y : 52;
  const availableWidth = Math.max(24, width - margins.left - margins.right - reserveX);
  const availableHeight = Math.max(24, height - margins.top - margins.bottom - reserveY);
  const maxX = Math.max(1, Number(bounds.maxX) || 0);
  const maxY = Math.max(1, Number(bounds.maxY) || 0);

  // 6% ruang dunia tambahan di luar titik terjauh dan puncak.
  const paddedWidth = maxX * 1.06;
  const paddedHeight = maxY * 1.06;
  const safeZoom = Math.min(4, Math.max(.2, Number(zoom) || 1));
  const autoScale = Math.min(availableWidth / paddedWidth, availableHeight / paddedHeight);
  return Math.max(1e-12, autoScale * safeZoom);
}

function drawScene() {
  if (!canvas || !ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  const r = state.result || {
    range: 9.6, max_height: 1.8, flight_time: 1.2,
    angle: 37, speed: 10, gravity: 10, launch_height: 0,
    vx: 8, vy: 6,
  };

  const target = state.mode === "challenge" ? Number(ui.target.value) : 0;
  // Mode perbandingan harus memuat keenam lintasan, bukan hanya lintasan sudut aktif.
  const visibleResults = state.mode === "compare" && state.comparisons.length
    ? state.comparisons : [r];
  const bounds = getTrajectoryBounds(visibleResults, target);
  const left = 62, right = 38, top = 48, bottom = 48;
  const factor = fitScale(width, height, bounds, { left, right, top, bottom }, state.zoom, { x: 42, y: 58 });
  const plotWidth = width - left - right;
  const ground = height - bottom;
  const scale = { left, ground, factor, plotWidth };
  state.scale = scale;

  // Langit.
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#9dd6ef");
  sky.addColorStop(.68, "#d8eff8");
  sky.addColorStop(1, "#f1f8f5");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Matahari dan awan.
  ctx.fillStyle = "rgba(255,223,143,.85)";
  ctx.beginPath(); ctx.arc(width - 72, 65, 24, 0, Math.PI * 2); ctx.fill();
  drawCloud(width * .24, 60, .72);
  drawCloud(width * .64, 42, .82);
  drawCloud(width * .83, 112, .62);

  // Bukit jauh.
  ctx.fillStyle = "#b9e5d8";
  ctx.beginPath();
  ctx.moveTo(0, ground - 28);
  ctx.quadraticCurveTo(width * .23, ground - 76, width * .45, ground - 28);
  ctx.quadraticCurveTo(width * .75, ground - 82, width, ground - 25);
  ctx.lineTo(width, ground); ctx.lineTo(0, ground); ctx.closePath(); ctx.fill();

  // Grid dan label skala.
  ctx.save();
  ctx.strokeStyle = "rgba(76,127,146,.15)";
  ctx.setLineDash([3, 5]);
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const y = top + (ground - top) * i / 4;
    ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
  }
  for (let i = 1; i <= 4; i++) {
    const x = left + plotWidth * i / 5;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, ground); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(57,101,119,.62)";
  ctx.font = "9px Consolas, monospace";
  ctx.fillText("TINGGI (m)", 10, 17);
  ctx.fillText("JARAK (m)", width - 78, height - 10);
  ctx.restore();

  // Tanah.
  ctx.fillStyle = "#64c7a4";
  ctx.fillRect(0, ground, width, height - ground);
  ctx.fillStyle = "#2fa888";
  ctx.fillRect(0, ground, width, 5);
  for (let x = 8; x < width; x += 18) {
    ctx.fillStyle = "#2d9f83";
    ctx.beginPath(); ctx.moveTo(x, ground - 1); ctx.lineTo(x + 4, ground - 9); ctx.lineTo(x + 8, ground - 1); ctx.fill();
  }

  const pointAt = (t, result) => {
    const x = result.vx * t;
    const y = Math.max(0, result.launch_height + result.vy * t - .5 * result.gravity * t * t);
    return worldToScreen(x, y, scale);
  };

  // Target pada mode tantangan.
  if (state.mode === "challenge") {
    const targetX = left + target * factor;
    ctx.save();
    ctx.strokeStyle = "#e68b52";
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(targetX, ground - 4); ctx.lineTo(targetX, ground - 64); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#d97d45";
    ctx.beginPath(); ctx.moveTo(targetX, ground - 63); ctx.lineTo(targetX + 23, ground - 55); ctx.lineTo(targetX, ground - 47); ctx.closePath(); ctx.fill();
    ctx.font = "bold 9px Consolas, monospace";
    ctx.fillText("TARGET", Math.min(targetX + 4, width - 55), ground - 70);
    ctx.restore();
  }

  // Lintasan perbandingan enam sudut.
  if (state.mode === "compare" && state.comparisons.length) {
    state.comparisons.forEach((item, index) => {
      ctx.beginPath();
      ctx.strokeStyle = ANGLE_COLORS[index];
      ctx.globalAlpha = .78;
      ctx.lineWidth = 2;
      const steps = 55;
      for (let i = 0; i <= steps; i++) {
        const t = item.flight_time * i / steps;
        const p = pointAt(t, item);
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  } else if (state.showTrail) {
    // Lintasan Soal 1 atau Lab Bebas.
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#ed777d";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(237,119,125,.25)";
    ctx.shadowBlur = 7;
    const steps = 75;
    for (let i = 0; i <= steps; i++) {
      const t = r.flight_time * i / steps;
      const p = pointAt(t, r);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Titik peluncuran dan ketapel.
  const launchPoint = worldToScreen(0, r.launch_height, scale);
  drawSlingshot(launchPoint.x - 7, ground + 2);

  // Titik puncak.
  const peak = worldToScreen(r.vx * (r.vy / r.gravity), r.max_height, scale);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#ed777d";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(peak.x, peak.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#5d587f";
  ctx.font = "bold 9px Consolas, monospace";
  ctx.fillText(
    "PUNCAK",
    Math.min(Math.max(peak.x + 8, left + 3), width - 58),
    Math.min(Math.max(peak.y - 10, top + 11), ground - 14)
  );

  // Boro bergerak sepanjang lintasan sesuai progress animasi.
  const t = r.flight_time * state.progress;
  const current = pointAt(t, r);
  const slope = Math.atan2(-(r.vy - r.gravity * t), r.vx || 0.0001);
  drawBoro(current.x, current.y - 10, 1, slope * .15);

  // Penanda akhir.
  const end = worldToScreen(r.range, 0, scale);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#ed777d";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(end.x, ground - 4, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Keterangan jarak.
  ctx.fillStyle = "#476c76";
  ctx.font = "bold 9px Consolas, monospace";
  const labelX = Math.min(Math.max(left + 5, end.x - 42), width - 65);
  ctx.fillText(`${format(r.range, 1)} m`, labelX, ground - 15);

  // Sudut awal sebagai busur kecil.
  ctx.save();
  ctx.strokeStyle = "#5e59c8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(launchPoint.x + 2, ground - 2, 27, -Math.PI, -Math.PI + Number(r.angle) * Math.PI / 180, false);
  ctx.stroke();
  ctx.fillStyle = "#514bb1";
  ctx.font = "bold 9px Consolas, monospace";
  ctx.fillText(`${r.angle}°`, launchPoint.x + 27, ground - 31);
  ctx.restore();
}

const previewUi = {
  caption: document.getElementById("lessonPreviewCaption"),
  stageLabel: document.getElementById("previewStageLabel"),
  directionLabel: document.getElementById("previewDirectionLabel"),
  range: document.getElementById("previewRange"),
  height: document.getElementById("previewHeight"),
  time: document.getElementById("previewTime"),
  costume: document.getElementById("costumeSelect"),
  costumeDescription: document.getElementById("costumeDescription"),
};

let previewRefreshTimer = null;
let previewRequestId = 0;

function updateZoomReadout() {
  const mainReadout = document.getElementById("scaleLabel");
  const previewReadout = document.getElementById("previewZoomLabel");
  if (mainReadout) mainReadout.textContent = state.zoom === 1
    ? "AUTO FIT" : `${Math.round(state.zoom * 100)}%`;
  if (previewReadout) previewReadout.textContent = previewState.zoom === 1
    ? "FIT" : `${Math.round(previewState.zoom * 100)}%`;
}

function setMainZoom(nextZoom) {
  state.zoom = Math.min(4, Math.max(0.2, Number(nextZoom)));
  drawScene();
  updateZoomReadout();
}

function setPreviewZoom(nextZoom) {
  previewState.zoom = Math.min(4, Math.max(0.2, Number(nextZoom)));
  drawLessonPreview();
  updateZoomReadout();
}

function setMainSpeed(value) {
  state.playbackRate = Number(value);
}

function setPreviewSpeed(value) {
  previewState.playbackRate = Number(value);
}

function playAnimation(target) {
  if (!target.result) return false;
  if (!(Number(target.result.flight_time) > 0)) {
    target.progress = 0;
    target.playing = false;
    return false;
  }
  // Play melanjutkan dari posisi pause; jika sudah selesai, mulai lagi dari awal.
  if (target.progress >= 1) target.progress = 0;
  target.direction = 1;
  target.playing = true;
  target.lastFrame = 0;
  return true;
}

function pauseAnimation(target) {
  target.playing = false;
  target.lastFrame = 0;
}

function backToStart(target) {
  // "Kembali" adalah lompatan langsung ke titik peluncuran, bukan gerak reverse.
  target.playing = false;
  target.progress = 0;
  target.direction = 1;
  target.lastFrame = 0;
  if (target === state) {
    ui.callout.textContent = "Boro kembali ke titik peluncuran. Tekan Mulai untuk meluncurkan lagi.";
    drawScene();
  } else {
    if (previewUi.directionLabel) previewUi.directionLabel.textContent = "SIAP";
    drawLessonPreview();
  }
}

function advanceAnimation(target, timestamp) {
  if (!target.playing || !target.result) {
    target.lastFrame = timestamp;
    return;
  }
  if (!target.lastFrame) {
    target.lastFrame = timestamp;
    return;
  }
  // Batasi delta setelah tab tidak aktif agar animasi tidak melompat jauh.
  const delta = Math.min(0.05, Math.max(0, (timestamp - target.lastFrame) / 1000));
  const duration = Math.max(Number(target.result.flight_time) || 0, 0.35);
  target.progress += (delta / duration) * target.playbackRate;

  if (target.progress >= 1) {
    target.progress = 1;
    target.playing = false;
  }
  target.lastFrame = timestamp;
}

function playMainAnimation() {
  if (!state.result) {
    refreshSimulation(true);
    return;
  }
  if (playAnimation(state)) ui.callout.textContent = "Boro mulai meluncur!";
}

function playPreviewAnimation() {
  if (!previewState.result) {
    refreshLessonPreview().then(() => playAnimation(previewState));
    return;
  }
  playAnimation(previewState);
}


function setCostume(costume) {
  state.costume = costume;
  const descriptions = {
    classic: "Boro klasik dengan jambul coral dan warna Flight Lab.",
    pilot: "Topi pilot, tali pengaman, dan kacamata penerbang.",
    explorer: "Topi penjelajah, pita warna, dan ransel kecil.",
    royal: "Mahkota, jubah, dan lencana Raja Langit.",
    astronaut: "Helm antariksa, visor, dan panel roket mini.",
    scientist: "Kacamata ilmuwan, jas lab, dan lencana eksperimen.",
    gardener: "Topi kebun, daun hias, dan tas perkakas.",
    racer: "Helm balap, garis kecepatan, dan syal nomor pembalap.",
  };
  if (previewUi.costumeDescription) {
    previewUi.costumeDescription.textContent = descriptions[costume] || descriptions.classic;
  }
  drawScene();
  drawLessonPreview();
}

function syncCharacterColorInputs() {
  const inputIds = {
    body: "boroBodyColor",
    wing: "boroWingColor",
    accessory: "boroAccessoryColor",
    accent: "boroAccentColor",
    beak: "boroBeakColor",
    feet: "boroFeetColor",
  };
  Object.entries(inputIds).forEach(([key, id]) => {
    const input = document.getElementById(id);
    if (input) input.value = state.colors[key];
  });
}

function setCharacterColor(key, value) {
  if (!Object.prototype.hasOwnProperty.call(DEFAULT_CHARACTER_COLORS, key)) return;
  if (!/^#[0-9a-f]{6}$/i.test(value)) return;
  state.colors[key] = value;
  document.querySelectorAll(".palette-button").forEach(button => button.classList.remove("selected"));
  drawScene();
  drawLessonPreview();
}

function applyCharacterPalette(paletteName) {
  const palette = CHARACTER_PALETTES[paletteName];
  if (!palette) return;
  state.colors = { ...palette };
  syncCharacterColorInputs();
  document.querySelectorAll(".palette-button").forEach(button => {
    button.classList.toggle("selected", button.dataset.palette === paletteName);
  });
  drawScene();
  drawLessonPreview();
}

function resetCharacterColors() {
  applyCharacterPalette("flightlab");
}

function readLessonPreviewInput() {
  let angle;
  let speed;
  let treeHeight = null;
  if (activeLesson === 4) {
    const firstBird = readBirdRows()[0];
    angle = firstBird.angle;
    speed = firstBird.speed;
    treeHeight = firstBird.tree_height;
  } else {
    angle = readNumericField("lessonAngle", "Sudut S", 0, 90);
    speed = readNumericField("lessonSpeed", "Kecepatan V", 0, 100000);
    if (activeLesson === 3) {
      treeHeight = readNumericField("lessonTreeHeight", "Tinggi pohon T", 0, 1000000);
    }
  }
  return { angle, speed, treeHeight };
}

function scheduleLessonPreview() {
  if (previewRefreshTimer) window.clearTimeout(previewRefreshTimer);
  previewRefreshTimer = window.setTimeout(refreshLessonPreview, 180);
}

async function refreshLessonPreview() {
  if (!previewCanvas || !previewCtx) return;
  const requestId = ++previewRequestId;
  try {
    const input = readLessonPreviewInput();
    const data = await postJSON("/api/simulate", {
      angle: input.angle,
      speed: input.speed,
      gravity: 10,
      launch_height: 0,
    });
    if (requestId !== previewRequestId) return;
    previewState.result = data.result;
    previewState.treeHeight = input.treeHeight;
    previewState.progress = 0;
    previewState.direction = 1;
    previewState.zoom = 1; // Pratinjau selalu kembali ke Auto Fit setelah input berubah.
    previewState.playing = false;
    previewState.lastFrame = 0;
    updateZoomReadout();

    previewUi.stageLabel.textContent = `SOAL ${activeLesson}`;
    previewUi.directionLabel.textContent = "SIAP";
    previewUi.range.textContent = `${format(data.result.range, 1)} m`;
    previewUi.height.textContent = `${format(data.result.max_height, 2)} m`;
    previewUi.time.textContent = `${format(data.result.flight_time, 3)} s`;
    previewUi.caption.textContent = data.result.flight_time <= 0
      ? "Kecepatan atau komponen vertikal terlalu kecil untuk membentuk lintasan terbang."
      : activeLesson === 4
        ? "Pratinjau otomatis Burung 1; hasil semua burung tetap dihitung di panel."
        : `Pratinjau otomatis untuk Soal ${activeLesson}, mengikuti angka yang lu masukkan.`;
    drawLessonPreview();
  } catch (error) {
    if (requestId === previewRequestId) {
      previewState.playing = false;
      previewUi.caption.textContent = error.message || "Periksa kembali angka masukan.";
    }
  }
}

function resizeLessonPreview() {
  if (!previewCanvas || !previewCtx) return;
  const rect = previewCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  previewCanvas.width = Math.round(rect.width * dpr);
  previewCanvas.height = Math.round(rect.height * dpr);
  previewCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  previewState.zoom = 1;
  drawLessonPreview();
  updateZoomReadout();
}

function drawLessonPreview() {
  if (!previewCanvas || !previewCtx) return;
  const width = previewCanvas.clientWidth;
  const height = previewCanvas.clientHeight;
  if (!width || !height) return;
  const c = previewCtx;
  const r = previewState.result || {
    angle: 37, speed: 10, gravity: 10, launch_height: 0,
    vx: 7.986, vy: 6.018, range: 9.6, max_height: 1.81, flight_time: 1.204,
  };
  const left = 38, right = 24, top = 27, bottom = 30;
  const bounds = getTrajectoryBounds([r], 0, previewState.treeHeight || 0);
  const factor = fitScale(width, height, bounds, { left, right, top, bottom }, previewState.zoom, { x: 30, y: 38 });
  const ground = height - bottom;
  const toPoint = (t) => ({
    x: left + r.vx * t * factor,
    y: ground - Math.max(0, r.launch_height + r.vy * t - .5 * r.gravity * t * t) * factor,
  });

  const sky = c.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#9ed9f0");
  sky.addColorStop(.72, "#dff3f7");
  sky.addColorStop(1, "#f2f8ef");
  c.fillStyle = sky;
  c.fillRect(0, 0, width, height);

  // Matahari dan awan kecil.
  c.fillStyle = "rgba(255,220,139,.85)";
  c.beginPath(); c.arc(width - 34, 35, 15, 0, Math.PI * 2); c.fill();
  drawCloud(width * .26, 32, .42, c);
  drawCloud(width * .68, 48, .34, c);

  // Garis grid halus.
  c.save();
  c.strokeStyle = "rgba(67,126,145,.14)";
  c.setLineDash([3, 4]);
  for (let i = 1; i <= 3; i++) {
    const y = top + (ground - top) * i / 4;
    c.beginPath(); c.moveTo(left, y); c.lineTo(width - right, y); c.stroke();
  }
  c.restore();

  // Bukit dan tanah.
  c.fillStyle = "#b9e5d8";
  c.beginPath();
  c.moveTo(0, ground - 17);
  c.quadraticCurveTo(width * .28, ground - 38, width * .52, ground - 15);
  c.quadraticCurveTo(width * .78, ground - 39, width, ground - 17);
  c.lineTo(width, ground); c.lineTo(0, ground); c.closePath(); c.fill();
  c.fillStyle = "#63c6a2";
  c.fillRect(0, ground, width, height - ground);
  c.fillStyle = "#2fa888";
  c.fillRect(0, ground, width, 3);

  // Garis tinggi pohon untuk Soal 3 dan 4.
  if (previewState.treeHeight !== null && Number.isFinite(previewState.treeHeight)) {
    const targetY = ground - previewState.treeHeight * factor;
    c.save();
    c.strokeStyle = "#e58b62";
    c.lineWidth = 1.6;
    c.setLineDash([4, 3]);
    c.beginPath(); c.moveTo(left, targetY); c.lineTo(width - right, targetY); c.stroke();
    c.setLineDash([]);
    c.fillStyle = "#c66f56";
    c.font = "8px Consolas, monospace";
    c.fillText(`TINGGI POHON ${format(previewState.treeHeight, 1)} m`, left + 4, Math.max(11, targetY - 5));
    c.restore();

    const treeX = width - 22;
    c.fillStyle = "#9a704b";
    c.fillRect(treeX - 3, Math.max(ground - 58, targetY), 6, ground - Math.max(ground - 58, targetY));
    c.fillStyle = "#3b9c79";
    c.beginPath();
    c.arc(treeX, Math.max(ground - 58, targetY) + 1, 12, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#70c49a";
    c.beginPath();
    c.arc(treeX - 5, Math.max(ground - 58, targetY) - 4, 6, 0, Math.PI * 2);
    c.fill();
  }

  // Lintasan.
  c.save();
  c.beginPath();
  c.strokeStyle = "#ed777d";
  c.lineWidth = 2.5;
  c.lineCap = "round";
  c.setLineDash([]);
  const steps = 58;
  for (let i = 0; i <= steps; i++) {
    const p = toPoint(r.flight_time * i / steps);
    if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y);
  }
  c.stroke();
  c.restore();

  // Ketapel dan posisi burung yang bergerak.
  drawSlingshot(left - 5, ground + 2, c, .55);
  const t = r.flight_time * previewState.progress;
  const current = toPoint(t);
  const slope = Math.atan2(-(r.vy - r.gravity * t), r.vx || .0001);
  drawBoro(current.x, current.y - 7, .64, slope * .15, c);

  // Penanda titik puncak.
  const peakTime = r.gravity > 0 ? r.vy / r.gravity : 0;
  const peak = toPoint(Math.min(r.flight_time, Math.max(0, peakTime)));
  c.fillStyle = "#fff";
  c.strokeStyle = "#ed777d";
  c.lineWidth = 1.5;
  c.beginPath(); c.arc(peak.x, peak.y, 3.2, 0, Math.PI * 2); c.fill(); c.stroke();

  // Label arah dan status ketercapaian.
  if (previewUi.directionLabel) {
    previewUi.directionLabel.textContent = previewState.playing
      ? "BERGERAK" : (previewState.progress >= 1 ? "SELESAI" : "SIAP");
  }
  if (previewState.treeHeight !== null) {
    const reached = r.max_height >= previewState.treeHeight;
    previewUi.directionLabel.textContent = reached ? "TINGGI TERCAPAI" : "BELUM TERCAPAI";
    previewUi.directionLabel.style.color = reached ? "#258b78" : "#b56d4e";
  }
}

function animationLoop(timestamp) {
  advanceAnimation(state, timestamp);
  advanceAnimation(previewState, timestamp);

  if (state.result) {
    if (!state.playing && state.progress >= 1) {
      ui.callout.textContent = "Boro sudah mendarat. Tekan Mulai untuk mengulang.";
    }
  }

  drawScene();
  drawLessonPreview();
  requestAnimationFrame(animationLoop);
}

document.querySelectorAll(".mode-tab").forEach(tab => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

[ui.angle, ui.speed, ui.gravity, ui.launchHeight, ui.target].forEach(input => {
  input.addEventListener("input", () => {
    updateLabels();
    refreshSimulation(false);
  });
});

document.querySelectorAll("[data-gravity]").forEach(button => {
  button.addEventListener("click", () => {
    ui.gravity.value = button.dataset.gravity;
    document.querySelectorAll("[data-gravity]").forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");
    refreshSimulation(false);
  });
});

document.getElementById("launchBtn").addEventListener("click", () => {
  state.direction = 1;
  refreshSimulation(true);
});
document.getElementById("playBtn").addEventListener("click", playMainAnimation);
document.getElementById("pauseBtn").addEventListener("click", () => pauseAnimation(state));
document.getElementById("backBtn").addEventListener("click", () => backToStart(state));
document.getElementById("zoomOutBtn").addEventListener("click", () => setMainZoom(state.zoom - .15));
document.getElementById("zoomFitBtn").addEventListener("click", () => setMainZoom(1));
document.getElementById("zoomInBtn").addEventListener("click", () => setMainZoom(state.zoom + .15));
document.getElementById("playbackSpeed").addEventListener("change", event => setMainSpeed(event.target.value));
document.getElementById("trailToggle").addEventListener("change", event => {
  state.showTrail = event.target.checked;
  drawScene();
});

document.getElementById("previewPlayBtn").addEventListener("click", playPreviewAnimation);
document.getElementById("previewPauseBtn").addEventListener("click", () => pauseAnimation(previewState));
document.getElementById("previewBackBtn").addEventListener("click", () => backToStart(previewState));
document.getElementById("previewZoomOutBtn").addEventListener("click", () => setPreviewZoom(previewState.zoom - .15));
document.getElementById("previewZoomFitBtn").addEventListener("click", () => setPreviewZoom(1));
document.getElementById("previewZoomInBtn").addEventListener("click", () => setPreviewZoom(previewState.zoom + .15));
document.getElementById("previewSpeed").addEventListener("change", event => setPreviewSpeed(event.target.value));
document.getElementById("costumeSelect").addEventListener("change", event => setCostume(event.target.value));
document.getElementById("boroBodyColor").addEventListener("input", event => setCharacterColor("body", event.target.value));
document.getElementById("boroWingColor").addEventListener("input", event => setCharacterColor("wing", event.target.value));
document.getElementById("boroAccessoryColor").addEventListener("input", event => setCharacterColor("accessory", event.target.value));
document.getElementById("boroAccentColor").addEventListener("input", event => setCharacterColor("accent", event.target.value));
document.getElementById("boroBeakColor").addEventListener("input", event => setCharacterColor("beak", event.target.value));
document.getElementById("boroFeetColor").addEventListener("input", event => setCharacterColor("feet", event.target.value));
document.getElementById("resetBoroColors").addEventListener("click", resetCharacterColors);
document.querySelectorAll(".palette-button").forEach(button => {
  button.addEventListener("click", () => applyCharacterPalette(button.dataset.palette));
});

window.addEventListener("resize", () => {
  resizeCanvas();
  resizeLessonPreview();
});


// ============================================================
// PUSAT BELAJAR: Subproblem 1–4 + tutorial langkah demi langkah
// Semua jawaban tugas dihitung oleh backend Python melalui Flask.
// ============================================================

const lessonDefinitions = {
  1: {
    number: "SUBPROBLEM 01",
    title: "Menghitung Jarak Horizontal Terjauh",
    description: "Hitung jarak horizontal terjauh yang dapat ditempuh Boro ketika diluncurkan menggunakan ketapel dan mendarat kembali pada ketinggian awal.",
    input: "Baris pertama S, yaitu sudut peluncuran 0–90°. Baris kedua V, yaitu kecepatan awal. Gravitasi diasumsikan 10 m/s².",
    output: "Satu bilangan yang menunjukkan jarak horizontal terjauh Boro mendarat di tanah.",
    sampleInput: "37\n10",
    sampleOutput: "9.6",
    sampleNote: "S = 37° · V = 10 m/s",
    hint: "Masukkan sudut S dan kecepatan awal V.",
    sample: { angle: 37, speed: 10 },
    tutorial: [
      {
        title: "Baca informasi pada soal",
        text: "Soal memberikan sudut peluncuran S dan kecepatan awal V. Nilai gravitasi sudah ditentukan, yaitu 10 m/s². Titik awal dan akhir dianggap setinggi sama.",
        formula: "Diketahui: S = 37° · V = 10 m/s · g = 10 m/s²"
      },
      {
        title: "Pilih rumus yang sesuai",
        text: "Untuk gerak parabola yang kembali ke ketinggian awal, gunakan rumus jarak horizontal. Pastikan sudut dinyatakan dalam derajat pada input.",
        formula: "R = (V² × sin(2θ)) / g"
      },
      {
        title: "Masukkan angka ke rumus",
        text: "Ganti V dengan 10, θ dengan 37°, dan g dengan 10. Nilai sin(74°) sekitar 0,96126.",
        formula: "R = (10² × sin(74°)) / 10 ≈ 9,6126 m"
      },
      {
        title: "Baca keluaran program",
        text: "Program membulatkan jarak menjadi satu angka di belakang koma, sesuai contoh pada buku. Isi S = 37 dan V = 10, lalu tekan tombol Hitung jawaban.",
        formula: "Keluaran: 9.6"
      }
    ]
  },
  2: {
    number: "SUBPROBLEM 02",
    title: "Menghitung Waktu Mencapai Jarak Terjauh",
    description: "Hitung waktu yang diperlukan Boro untuk mencapai jarak horizontal terjauh ketika diluncurkan dari tanah dan kembali ke ketinggian yang sama.",
    input: "Baris pertama S, yaitu sudut peluncuran 0–90°. Baris kedua V, yaitu kecepatan awal. Gravitasi diasumsikan 10 m/s².",
    output: "Satu bilangan yang menunjukkan waktu tempuh Boro untuk mencapai jarak terjauh, dengan tiga angka di belakang koma.",
    sampleInput: "37\n100",
    sampleOutput: "12.036",
    sampleNote: "S = 37° · V = 100 m/s",
    hint: "Masukkan sudut S dan kecepatan awal V.",
    sample: { angle: 37, speed: 100 },
    tutorial: [
      {
        title: "Kenali apa yang ditanyakan",
        text: "Berbeda dari Soal 1, kali ini yang dicari adalah waktu ketika Boro mencapai jarak horizontal terjauh. Karena Boro mendarat pada ketinggian awal, waktu tersebut sama dengan total waktu terbang.",
        formula: "Diketahui: S = 37° · V = 100 m/s · g = 10 m/s²"
      },
      {
        title: "Gunakan rumus waktu terbang",
        text: "Komponen kecepatan vertikal adalah V × sin(θ). Waktu naik dan turun sama, sehingga total waktu adalah dua kali waktu untuk mencapai puncak.",
        formula: "t = (2 × V × sin(θ)) / g"
      },
      {
        title: "Substitusikan nilai",
        text: "Masukkan kecepatan 100 m/s, sudut 37°, dan gravitasi 10 m/s². Perhitungan menghasilkan sekitar 12,0363 detik.",
        formula: "t = (2 × 100 × sin(37°)) / 10 ≈ 12,0363 s"
      },
      {
        title: "Baca keluaran tiga desimal",
        text: "Sesuai format keluaran buku, tampilkan tiga angka di belakang koma. Coba isi S = 37 dan V = 100 pada panel input, kemudian tekan Hitung jawaban.",
        formula: "Keluaran: 12.036"
      }
    ]
  },
  3: {
    number: "SUBPROBLEM 03",
    title: "Prediksi Ketinggian yang Dicapai Boro",
    description: "Prediksi apakah Boro dapat mencapai ketinggian pohon tempat sarangnya berada saat diluncurkan dengan ketapel.",
    input: "Baris pertama S (sudut 0–90°), baris kedua V (kecepatan awal), dan baris ketiga T (tinggi pohon). Gravitasi 10 m/s².",
    output: "Status 1 jika tinggi maksimum sama dengan atau melebihi T, atau 0 jika tidak. Program juga menampilkan tinggi maksimum.",
    sampleInput: "37\n100\n100",
    sampleOutput: "Status: 1\nKetinggian: 181.09",
    sampleNote: "S = 37° · V = 100 m/s · T = 100 m",
    hint: "Masukkan S, V, dan tinggi pohon T.",
    sample: { angle: 37, speed: 100, treeHeight: 100 },
    tutorial: [
      {
        title: "Pahami target ketinggian",
        text: "Soal meminta kita membandingkan tinggi maksimum lintasan Boro dengan tinggi pohon T. Jika tinggi maksimum mencapai atau melewati T, statusnya 1. Jika kurang, statusnya 0.",
        formula: "Diketahui: S = 37° · V = 100 m/s · T = 100 m"
      },
      {
        title: "Hitung komponen kecepatan vertikal",
        text: "Kecepatan vertikal menentukan seberapa tinggi Boro naik. Komponen ini diperoleh dari kecepatan awal dikalikan sinus sudut.",
        formula: "Vy = V × sin(θ)"
      },
      {
        title: "Hitung tinggi maksimum",
        text: "Tinggi maksimum diukur dari tanah karena tinggi awal pada soal dianggap 0 meter. Gunakan rumus energi/kinematika vertikal berikut.",
        formula: "Hmaks = Vy² / (2g) = (V × sin θ)² / (2g) ≈ 181.09 m"
      },
      {
        title: "Tentukan status 1 atau 0",
        text: "Bandingkan 181,09 m dengan tinggi pohon 100 m. Karena 181,09 ≥ 100, Boro mencapai tinggi pohon sehingga statusnya 1. Coba ubah T menjadi 200 m; statusnya akan menjadi 0.",
        formula: "181.09 ≥ 100 → Status = 1"
      }
    ]
  },
  4: {
    number: "SUBPROBLEM 04",
    title: "Prediksi Ketinggian Banyak Burung",
    description: "Prediksi apakah setiap burung yang ikut peluncuran dapat mencapai ketinggian pohon tempat sarangnya. Setiap burung diperiksa secara bergantian.",
    input: "Masukkan N sebagai jumlah burung. Setelah itu masukkan satu set data S, V, dan T untuk setiap burung. Format contoh buku menunjukkan data S, V, T berulang untuk setiap burung.",
    output: "Status setiap burung: 1 jika tinggi maksimum mencapai atau melebihi tinggi pohonnya, dan 0 jika tidak. Tinggi maksimum tiap burung juga ditampilkan.",
    sampleInput: "2\n37\n100\n100\n37\n100\n200",
    sampleOutput: "Status Burung 1: 1\nKetinggian: 181.09\nStatus Burung 2: 0\nKetinggian: 181.09",
    sampleNote: "N = 2 · Setiap burung memiliki S, V, T",
    hint: "Atur jumlah burung, lalu isi S, V, dan T untuk masing-masing burung.",
    sample: {
      birds: [
        { angle: 37, speed: 100, tree_height: 100 },
        { angle: 37, speed: 100, tree_height: 200 }
      ]
    },
    tutorial: [
      {
        title: "Tentukan jumlah burung",
        text: "Baris pertama adalah N, yaitu jumlah burung yang ikut peluncuran. Pada contoh ini ada dua burung. Setiap burung memiliki data sudut, kecepatan awal, dan tinggi pohon.",
        formula: "N = 2"
      },
      {
        title: "Masukkan data setiap burung",
        text: "Isi S, V, dan T untuk Burung 1, kemudian isi lagi S, V, dan T untuk Burung 2. Perhitungan setiap burung dilakukan secara terpisah.",
        formula: "Burung 1: S=37°, V=100, T=100 m\nBurung 2: S=37°, V=100, T=200 m"
      },
      {
        title: "Hitung dan bandingkan tinggi",
        text: "Gunakan rumus tinggi maksimum Hmaks = (V × sin θ)²/(2g) untuk setiap burung, lalu bandingkan hasilnya dengan tinggi pohon masing-masing.",
        formula: "Hmaks masing-masing ≈ 181.09 m"
      },
      {
        title: "Baca status seluruh burung",
        text: "Burung 1 mencapai pohon 100 m sehingga statusnya 1. Burung 2 tidak mencapai pohon 200 m sehingga statusnya 0. Coba ubah jumlah burung atau tinggi pohon untuk eksperimen.",
        formula: "Burung 1: 181.09 ≥ 100 → 1\nBurung 2: 181.09 < 200 → 0"
      }
    ]
  }
};

let activeLesson = 1;
let birdInputData = [
  { angle: 37, speed: 100, tree_height: 100 },
  { angle: 37, speed: 100, tree_height: 200 }
];
let activeTutorialStep = 0;

const lessonElements = {
  number: document.getElementById("lessonNumber"),
  title: document.getElementById("lessonTitle"),
  description: document.getElementById("lessonDescription"),
  inputFormat: document.getElementById("lessonInputFormat"),
  outputFormat: document.getElementById("lessonOutputFormat"),
  sampleInput: document.getElementById("lessonSampleInput"),
  sampleOutput: document.getElementById("lessonSampleOutput"),
  sampleNote: document.getElementById("sampleNote"),
  hint: document.getElementById("lessonInputHint"),
  singleFields: document.getElementById("singleBirdFields"),
  multiFields: document.getElementById("multiBirdFields"),
  treeHeightField: document.getElementById("treeHeightField"),
  birdCount: document.getElementById("birdCount"),
  birdRows: document.getElementById("birdRows"),
  result: document.getElementById("problemResult"),
  output: document.getElementById("problemOutput"),
  explanation: document.getElementById("problemExplanation"),
  error: document.getElementById("problemError"),
  tutorialContent: document.getElementById("tutorialContent"),
  tutorialToggle: document.getElementById("tutorialToggle"),
  tutorialCounter: document.getElementById("tutorialStepCounter"),
  tutorialDots: document.getElementById("tutorialDots"),
  tutorialTitle: document.getElementById("tutorialStepTitle"),
  tutorialText: document.getElementById("tutorialStepText"),
  tutorialFormula: document.getElementById("tutorialFormula"),
  tutorialPrev: document.getElementById("tutorialPrev"),
  tutorialNext: document.getElementById("tutorialNext")
};

function setLessonField(id, value) {
  document.getElementById(id).value = value;
}

function renderBirdRows() {
  lessonElements.birdRows.innerHTML = "";
  birdInputData.forEach((bird, index) => {
    const row = document.createElement("div");
    row.className = "bird-input-row";
    row.dataset.birdIndex = String(index);
    row.innerHTML = `
      <div class="bird-row-title"><strong>🐦 Burung ${index + 1}</strong><button type="button" data-remove-bird="${index}" aria-label="Hapus burung ${index + 1}">×</button></div>
      <div class="bird-row-fields">
        <label><span>S · Sudut</span><input type="number" min="0" max="90" step="1" data-bird-field="angle" value="${bird.angle}"></label>
        <label><span>V · Kecepatan</span><input type="number" min="0" max="10000" step="0.1" data-bird-field="speed" value="${bird.speed}"></label>
        <label><span>T · Tinggi pohon</span><input type="number" min="0" max="100000" step="0.1" data-bird-field="tree_height" value="${bird.tree_height}"></label>
      </div>`;
    lessonElements.birdRows.appendChild(row);
  });

  lessonElements.birdRows.querySelectorAll("[data-remove-bird]").forEach(button => {
    button.addEventListener("click", () => {
      if (birdInputData.length <= 1) {
        showLessonError("Minimal harus ada satu burung.");
        return;
      }
      birdInputData.splice(Number(button.dataset.removeBird), 1);
      lessonElements.birdCount.value = birdInputData.length;
      renderBirdRows();
      clearProblemResult();
    });
  });
}

function syncBirdCount() {
  const rawCount = Number(lessonElements.birdCount.value);
  if (!Number.isInteger(rawCount) || rawCount < 1 || rawCount > 50) {
    showLessonError("Jumlah burung harus berupa bilangan bulat 1 sampai 50.");
    return;
  }
  while (birdInputData.length < rawCount) {
    birdInputData.push({ angle: 37, speed: 100, tree_height: 100 });
  }
  while (birdInputData.length > rawCount) birdInputData.pop();
  renderBirdRows();
  clearProblemResult();
  scheduleLessonPreview();
}

function clearProblemResult() {
  lessonElements.result.classList.add("hidden");
  lessonElements.error.classList.add("hidden");
  lessonElements.output.textContent = "";
  lessonElements.explanation.textContent = "";
}

function showLessonError(message) {
  lessonElements.error.textContent = message;
  lessonElements.error.classList.remove("hidden");
}

function renderLesson(problemNumber) {
  activeLesson = problemNumber;
  const lesson = lessonDefinitions[problemNumber];

  document.querySelectorAll(".lesson-tab").forEach(tab => {
    const active = Number(tab.dataset.lesson) === problemNumber;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  lessonElements.number.textContent = lesson.number;
  lessonElements.title.textContent = lesson.title;
  lessonElements.description.textContent = lesson.description;
  lessonElements.inputFormat.textContent = lesson.input;
  lessonElements.outputFormat.textContent = lesson.output;
  lessonElements.sampleInput.textContent = lesson.sampleInput;
  lessonElements.sampleOutput.textContent = lesson.sampleOutput;
  lessonElements.sampleNote.textContent = lesson.sampleNote;
  lessonElements.hint.textContent = lesson.hint;

  const isMultiBird = problemNumber === 4;
  lessonElements.singleFields.classList.toggle("hidden", isMultiBird);
  lessonElements.multiFields.classList.toggle("hidden", !isMultiBird);
  lessonElements.treeHeightField.classList.toggle("hidden", problemNumber !== 3);

  if (isMultiBird) {
    birdInputData = lesson.sample.birds.map(bird => ({ ...bird }));
    lessonElements.birdCount.value = birdInputData.length;
    renderBirdRows();
  } else {
    setLessonField("lessonAngle", lesson.sample.angle);
    setLessonField("lessonSpeed", lesson.sample.speed);
    if (problemNumber === 3) setLessonField("lessonTreeHeight", lesson.sample.treeHeight);
  }

  clearProblemResult();
  activeTutorialStep = 0;
  lessonElements.tutorialContent.classList.add("hidden");
  scheduleLessonPreview();
  lessonElements.tutorialToggle.innerHTML = 'Mulai tutorial <span>↗</span>';
  renderTutorialStep();
}

function loadLessonExample() {
  const sample = lessonDefinitions[activeLesson].sample;
  if (activeLesson === 4) {
    birdInputData = sample.birds.map(bird => ({ ...bird }));
    lessonElements.birdCount.value = birdInputData.length;
    renderBirdRows();
  } else {
    setLessonField("lessonAngle", sample.angle);
    setLessonField("lessonSpeed", sample.speed);
    if (activeLesson === 3) setLessonField("lessonTreeHeight", sample.treeHeight);
  }
  clearProblemResult();
  scheduleLessonPreview();
}

function readNumericField(id, label, min, max) {
  const raw = document.getElementById(id).value.trim();
  if (raw === "") throw new Error(`${label} belum diisi.`);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} harus berada pada rentang ${min} sampai ${max}.`);
  }
  if (label.includes("Sudut") && !Number.isInteger(value)) {
    throw new Error(`${label} harus berupa bilangan bulat.`);
  }
  return value;
}

function readBirdRows() {
  const rows = [...lessonElements.birdRows.querySelectorAll(".bird-input-row")];
  if (rows.length < 1) throw new Error("Masukkan minimal satu burung.");
  return rows.map((row, index) => {
    const read = field => {
      const input = row.querySelector(`[data-bird-field="${field}"]`);
      if (!input || input.value.trim() === "") throw new Error(`Data ${field} Burung ${index + 1} belum diisi.`);
      const value = Number(input.value);
      if (!Number.isFinite(value)) throw new Error(`Data Burung ${index + 1} harus berupa angka.`);
      return value;
    };
    const angle = read("angle");
    const speed = read("speed");
    const tree_height = read("tree_height");
    if (!Number.isInteger(angle) || angle < 0 || angle > 90) throw new Error(`Sudut Burung ${index + 1} harus bilangan bulat 0–90 derajat.`);
    if (speed < 0 || tree_height < 0) throw new Error(`Kecepatan dan tinggi pohon Burung ${index + 1} tidak boleh negatif.`);
    return { angle, speed, tree_height };
  });
}

function renderProblemResult(result) {
  let output = "";
  let explanation = "";

  if (activeLesson === 1) {
    output = Number(result.rounded_range).toFixed(1);
    explanation = `Jarak horizontal terjauh Boro adalah ${output} meter. Perhitungan dilakukan dengan gravitasi 10 m/s².`;
  } else if (activeLesson === 2) {
    output = Number(result.flight_time).toFixed(3);
    explanation = `Boro mencapai jarak horizontal terjauh setelah ${output} detik.`;
  } else if (activeLesson === 3) {
    output = `Status: ${result.status}\nKetinggian: ${Number(result.max_height).toFixed(2)}`;
    explanation = result.status === 1
      ? `Tinggi maksimum ${Number(result.max_height).toFixed(2)} m mencapai atau melebihi tinggi pohon ${Number(result.tree_height).toFixed(2)} m.`
      : `Tinggi maksimum ${Number(result.max_height).toFixed(2)} m belum mencapai tinggi pohon ${Number(result.tree_height).toFixed(2)} m.`;
  } else {
    output = result.birds.map(bird =>
      `Status Burung ${bird.bird_number}: ${bird.status}\nKetinggian: ${Number(bird.max_height).toFixed(2)}`
    ).join("\n\n");
    explanation = `${result.count} burung telah dihitung. Status 1 berarti tinggi maksimum mencapai atau melebihi tinggi pohonnya; status 0 berarti belum mencapai.`;
  }

  lessonElements.output.textContent = output;
  lessonElements.explanation.textContent = explanation;
  lessonElements.result.classList.remove("hidden");
  lessonElements.error.classList.add("hidden");
}

async function solveCurrentLesson() {
  clearProblemResult();
  try {
    let payload;
    if (activeLesson === 4) {
      const birds = readBirdRows();
      if (Number(lessonElements.birdCount.value) !== birds.length) {
        throw new Error("Jumlah burung N harus sama dengan jumlah data burung.");
      }
      payload = { birds };
    } else {
      payload = {
        angle: readNumericField("lessonAngle", "Sudut S", 0, 90),
        speed: readNumericField("lessonSpeed", "Kecepatan V", 0, 100000)
      };
      if (activeLesson === 3) {
        payload.tree_height = readNumericField("lessonTreeHeight", "Tinggi pohon T", 0, 1000000);
      }
    }
    const data = await postJSON(`/api/problem/${activeLesson}`, payload);
    renderProblemResult(data.result);
    scheduleLessonPreview();
  } catch (error) {
    showLessonError(error.message || "Perhitungan gagal. Periksa kembali masukan.");
  }
}

function sendLessonToSimulation() {
  try {
    let angle;
    let speed;
    if (activeLesson === 4) {
      const firstBird = readBirdRows()[0];
      angle = firstBird.angle;
      speed = firstBird.speed;
    } else {
      angle = readNumericField("lessonAngle", "Sudut S", 0, 90);
      speed = readNumericField("lessonSpeed", "Kecepatan V", 0, 100000);
    }

    ui.angle.value = String(angle);
    ui.speed.value = String(speed);
    ui.gravity.value = "10";
    ui.launchHeight.value = "0";
    setMode("assignment");
    state.direction = 1;
    refreshSimulation(true);
    document.getElementById("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
    ui.callout.textContent = activeLesson === 4
      ? "Simulasi menampilkan data Burung 1."
      : `Data Soal ${activeLesson} sudah dikirim ke simulasi atas.`;
  } catch (error) {
    showLessonError(error.message);
  }
}

function applyTutorialFocus() {
  document.querySelectorAll(".tutorial-focus").forEach(el => el.classList.remove("tutorial-focus"));
  if (lessonElements.tutorialContent.classList.contains("hidden")) return;
  const targets = [
    [document.querySelector(".lesson-card")],
    [activeLesson === 4 ? lessonElements.multiFields : lessonElements.singleFields],
    [document.getElementById("solveProblemButton")],
    [document.getElementById("problemResult"), document.querySelector(".lesson-preview-card")],
  ];
  (targets[activeTutorialStep] || []).filter(Boolean).forEach(el => el.classList.add("tutorial-focus"));
}

function renderTutorialStep() {
  const steps = lessonDefinitions[activeLesson].tutorial;
  const step = steps[activeTutorialStep];
  lessonElements.tutorialCounter.textContent = `LANGKAH ${activeTutorialStep + 1} / ${steps.length}`;
  lessonElements.tutorialTitle.textContent = step.title;
  lessonElements.tutorialText.textContent = step.text;
  lessonElements.tutorialFormula.textContent = step.formula;
  lessonElements.tutorialPrev.disabled = activeTutorialStep === 0;
  lessonElements.tutorialNext.textContent = activeTutorialStep === steps.length - 1
    ? "Selesai ✓" : "Langkah berikutnya →";
  lessonElements.tutorialDots.innerHTML = "";
  steps.forEach((_, index) => {
    const dot = document.createElement("span");
    dot.className = index === activeTutorialStep ? "active" : "";
    lessonElements.tutorialDots.appendChild(dot);
  });
  applyTutorialFocus();
}

document.querySelectorAll(".lesson-tab").forEach(tab => {
  tab.addEventListener("click", () => renderLesson(Number(tab.dataset.lesson)));
});
document.getElementById("loadExampleButton").addEventListener("click", loadLessonExample);
document.getElementById("solveProblemButton").addEventListener("click", solveCurrentLesson);
["lessonAngle", "lessonSpeed", "lessonTreeHeight"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    clearProblemResult();
    scheduleLessonPreview();
  });
});
document.getElementById("useInSimulationButton").addEventListener("click", sendLessonToSimulation);
document.getElementById("birdCount").addEventListener("change", syncBirdCount);
document.getElementById("addBirdButton").addEventListener("click", () => {
  if (birdInputData.length >= 50) {
    showLessonError("Jumlah burung maksimal 50.");
    return;
  }
  birdInputData.push({ angle: 37, speed: 100, tree_height: 100 });
  lessonElements.birdCount.value = birdInputData.length;
  renderBirdRows();
  clearProblemResult();
  scheduleLessonPreview();
});
lessonElements.birdRows.addEventListener("input", event => {
  const row = event.target.closest(".bird-input-row");
  if (!row || !event.target.dataset.birdField) return;
  const index = Number(row.dataset.birdIndex);
  const field = event.target.dataset.birdField;
  birdInputData[index][field] = Number(event.target.value);
  clearProblemResult();
  scheduleLessonPreview();
});
lessonElements.tutorialToggle.addEventListener("click", () => {
  const willOpen = lessonElements.tutorialContent.classList.contains("hidden");
  lessonElements.tutorialContent.classList.toggle("hidden", !willOpen);
  lessonElements.tutorialToggle.innerHTML = willOpen ? 'Tutup tutorial <span>×</span>' : 'Mulai tutorial <span>↗</span>';
  activeTutorialStep = 0;
  renderTutorialStep();
  if (!willOpen) document.querySelectorAll(".tutorial-focus").forEach(el => el.classList.remove("tutorial-focus"));
});
lessonElements.tutorialPrev.addEventListener("click", () => {
  if (activeTutorialStep > 0) activeTutorialStep -= 1;
  renderTutorialStep();
});
lessonElements.tutorialNext.addEventListener("click", () => {
  const last = lessonDefinitions[activeLesson].tutorial.length - 1;
  if (activeTutorialStep < last) {
    activeTutorialStep += 1;
    renderTutorialStep();
  } else {
    lessonElements.tutorialContent.classList.add("hidden");
    lessonElements.tutorialToggle.innerHTML = 'Mulai tutorial <span>↗</span>';
    document.querySelectorAll(".tutorial-focus").forEach(el => el.classList.remove("tutorial-focus"));
  }
});

// Muat pusat belajar pada Subproblem 1 saat halaman dibuka.
renderLesson(1);
syncCharacterColorInputs();


// Mulai dari contoh buku: sudut 37°, kecepatan 10 m/s, gravitasi 10 m/s².
updateLabels();
resizeCanvas();
resizeLessonPreview();
refreshSimulation(false);
scheduleLessonPreview();
requestAnimationFrame(animationLoop);
