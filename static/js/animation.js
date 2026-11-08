/*
 * FLIGHT LAB | frontend
 * Semua angka fisika berasal dari backend Python (physics.py).
 * Fitur: Soal 1–4, insight dinamis, tutorial, riwayat lokal, dan animasi.
 */

const $ = (id) => document.getElementById(id);
const canvas = $("flightCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

function isMobileView() {
  return window.innerWidth <= 768;
}

const ui = {
  angle: $("angleInput"), speed: $("speedInput"), gravity: $("gravityInput"),
  launchHeight: $("launchHeightInput"), target: $("targetInput"),
  angleOut: $("angleOutput"), speedOut: $("speedOutput"), gravityOut: $("gravityOutput"),
  launchHeightOut: $("launchHeightOutput"), targetOut: $("targetOutput"),
  range: $("rangeValue"), height: $("heightValue"), time: $("timeValue"), vx: $("vxValue"),
  stageMode: $("stageMode"), modeDescription: $("modeDescription"),
  fixedGravity: $("fixedGravity"), challengeResult: $("challengeResult"),
  compareSection: $("compareSection"), comparisonBody: $("comparisonBody"),
  comparisonFootnote: $("comparisonFootnote"), callout: $("calloutText"),
  questionPicker: $("questionPicker"), formulaNumber: $("formulaNumber"),
  formulaTitle: $("formulaTitle"), formulaDescription: $("formulaDescription"),
  formulaEquation: $("formulaEquation"), formulaVariables: $("formulaVariables"),
  formulaSubstitution: $("formulaSubstitution"), formulaSteps: $("formulaSteps"),
  formulaAnswer: $("formulaAnswer"), formulaNote: $("formulaNote"),
  questionSourceNote: $("questionSourceNote"), insightTitle: $("insightTitle"),
  insightText: $("insightText"), insightPoints: $("insightPoints"), insightTip: $("insightTip"),
  problemTitle: $("problemTitle"), problemSubtitle: $("problemSubtitle"),
  problemDescription: $("problemDescription"), problemAssumptions: $("problemAssumptions"),
  problemSampleResult: $("problemSampleResult"),
  historyList: $("historyList"), historyEmpty: $("historyEmpty"),
  tutorialTitle: $("tutorialTitle"), tutorialText: $("tutorialText"),
  tutorialProgress: $("tutorialProgress"), tutorialStepLabel: $("tutorialStepLabel"),
};

const QUESTIONS = {
  1: {
    title: "Menghitung jarak horizontal",
    description: "Menentukan seberapa jauh Boro mendarat dari titik peluncuran.",
    problemTitle: "Soal 1 | Menghitung Jarak Horizontal Terjauh",
    problemDescription: "Hitung jarak horizontal terjauh yang dapat ditempuh oleh Boro apabila Boro ikut berdiri di atas semangka yang akan diluncurkan oleh pemilik lahan.",
    assumptions: "Masukan berupa sudut peluncuran S (0–90) dan kecepatan awal V. Gravitasi diasumsikan 10 m/s², titik peluncuran dan pendaratan berada pada ketinggian sama, serta hambatan udara diabaikan.",
    badge: "SOAL 1",
  },
  2: {
    title: "Menghitung tinggi maksimum",
    description: "Menentukan ketinggian tertinggi yang dicapai Boro dari titik peluncuran.",
    problemTitle: "Soal 2 | Menghitung Tinggi Maksimum (Pengayaan)",
    problemDescription: "Pengayaan: tentukan kenaikan tinggi maksimum yang dicapai Boro setelah diluncurkan. Perhatikan komponen kecepatan vertikalnya.",
    assumptions: "Gunakan model gerak parabola ideal tanpa hambatan udara. Tinggi maksimum pada rumus dihitung dari titik peluncuran; tinggi dari tanah ditampilkan terpisah.",
    badge: "SOAL 2",
  },
  3: {
    title: "Menghitung waktu terbang",
    description: "Menentukan lama Boro berada di udara hingga menyentuh tanah.",
    problemTitle: "Soal 3 | Menghitung Waktu Terbang (Pengayaan)",
    problemDescription: "Pengayaan: hitung berapa lama Boro berada di udara sejak meninggalkan ketapel sampai menyentuh permukaan tanah.",
    assumptions: "Untuk titik awal dan akhir setinggi sama, waktu terbang adalah dua kali waktu naik. Jika tinggi awal diubah pada Lab Bebas, sistem memakai persamaan waktu jatuh umum.",
    badge: "SOAL 3",
  },
  4: {
    title: "Menguraikan komponen kecepatan",
    description: "Memisahkan kecepatan awal menjadi komponen horizontal dan vertikal.",
    problemTitle: "Soal 4 | Komponen Kecepatan (Pengayaan)",
    problemDescription: "Pengayaan: uraikan kecepatan awal Boro menjadi komponen mendatar (Vx) dan vertikal (Vy), lalu pahami peran masing-masing komponen.",
    assumptions: "Vx menentukan gerak mendatar, sedangkan Vy menentukan gerak naik dan turun. Hambatan udara diabaikan sehingga Vx dianggap tetap.",
    badge: "SOAL 4",
  },
};

const state = {
  mode: "assignment",
  question: 1,
  result: null,
  solution: null,
  comparisons: [],
  progress: 0,
  playing: false,
  showTrail: true,
  lastFrame: 0,
  requestToken: 0,
  playSpeed: 1,
  zoom: 1,
  skin: "mint",
  history: [],
  tutorialStep: -1,
  tutorialActive: false,
};

const HISTORY_KEY = "flightLab.experiments.v1";
const ANGLE_COLORS = ["#ed7a75", "#f0a64f", "#6c66d9", "#20a997", "#4b9acb", "#a77acb"];

function format(value, digits = 2) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "0";
}

function params() {
  const isSchoolMode = state.mode !== "lab";
  return {
    angle: Number(ui.angle.value),
    speed: Number(ui.speed.value),
    gravity: isSchoolMode ? 10 : Number(ui.gravity.value),
    launch_height: state.mode === "lab" ? Number(ui.launchHeight.value) : 0,
  };
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
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Server mengirim jawaban yang tidak dapat dibaca.");
  }
  if (!response.ok || !data.ok) throw new Error(data.error || "Perhitungan tidak berhasil.");
  return data;
}

function setCallout(message) {
  if (ui.callout) ui.callout.textContent = message;
}

async function refreshSimulation(autoplay = false, save = false) {
  updateLabels();
  const token = ++state.requestToken;
  try {
    const currentParams = params();
    const simulation = await postJSON("/api/simulate", currentParams);
    let solution = null;
    let comparison = null;

    if (state.mode === "assignment") {
      const solved = await postJSON("/api/solve", {
        ...currentParams,
        question: state.question,
      });
      solution = solved.solution;
    } else if (state.mode === "compare") {
      comparison = await postJSON("/api/compare", {
        speed: currentParams.speed,
        gravity: currentParams.gravity,
        launch_height: currentParams.launch_height,
      });
    }

    // Abaikan respons lama jika pengguna menggeser slider dengan cepat.
    if (token !== state.requestToken) return;

    state.result = simulation.result;
    state.solution = solution;
    if (comparison) state.comparisons = comparison.results;

    renderMetrics();
    if (state.mode === "compare") renderComparison();
    renderInsight();

    if (autoplay) {
      state.progress = 0;
      state.playing = true;
      state.lastFrame = 0;
      setCallout("Boro meluncur! Perhatikan lintasan dan hasilnya.");
    } else {
      drawScene();
    }
    if (save) saveExperiment();
  } catch (error) {
    if (token !== state.requestToken) return;
    state.playing = false;
    setCallout(error.message.includes("Failed to fetch")
      ? "Python Engine tidak tersambung. Pastikan terminal masih menjalankan python app.py."
      : error.message);
  }
}

function renderMetrics() {
  const r = state.result;
  if (!r) return;
  ui.range.textContent = format(r.range, 1);
  ui.height.textContent = format(r.max_height, 2);
  ui.time.textContent = format(r.flight_time, 3);
  ui.vx.textContent = format(r.vx, 2);

  if (state.mode === "assignment" && state.solution) {
    renderFormula(state.solution);
    setCallout(`${QUESTIONS[state.question].badge}: ${QUESTIONS[state.question].title}.`);
  } else {
    renderExplorationFormula();
    if (state.mode === "lab") setCallout("Lab bebas: ubah gravitasi dan tinggi awal untuk bereksperimen.");
    if (state.mode === "compare") setCallout("Mode bandingkan: amati bentuk enam lintasan.");
    if (state.mode === "challenge") renderChallengeResult();
  }
}

function renderFormula(solution) {
  ui.formulaNumber.textContent = `${String(solution.number).padStart(2, "0")} / 04`;
  ui.formulaTitle.textContent = solution.title;
  ui.formulaDescription.textContent = solution.subtitle;
  ui.formulaEquation.textContent = solution.formula;
  ui.formulaSubstitution.textContent = solution.substitution;
  ui.formulaAnswer.textContent = solution.answer;
  ui.formulaNote.textContent = solution.note;
  ui.questionSourceNote.textContent = solution.number === 1
    ? "Soal 1 mengikuti deskripsi dan contoh yang tersedia pada file proyek."
    : "Catatan: Soal 2–4 adalah soal pengayaan yang disusun untuk website. Naskah soal asli nomor 2–4 tidak ada di ZIP sumber.";
  ui.formulaVariables.replaceChildren();
  solution.variables.forEach((variable) => {
    const item = document.createElement("span");
    item.textContent = variable;
    ui.formulaVariables.appendChild(item);
  });
  ui.formulaSteps.replaceChildren();
  solution.steps.forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    ui.formulaSteps.appendChild(item);
  });
  ui.problemSampleResult.textContent = `Hasil saat ini: ${solution.answer}.`;
}

function renderExplorationFormula() {
  const r = state.result;
  if (!r) return;
  ui.formulaNumber.textContent = "LAB";
  ui.formulaTitle.textContent = "Persamaan gerak parabola";
  ui.formulaDescription.textContent = "Dalam Lab Bebas, tinggi awal dan gravitasi dapat berubah. Gunakan persamaan posisi terhadap waktu.";
  ui.formulaEquation.textContent = "x(t) = Vx · t   |   y(t) = h + Vy · t − ½gt²";
  ui.formulaVariables.replaceChildren();
  [
    `Vx = ${format(r.vx, 2)} m/s`,
    `Vy = ${format(r.vy, 2)} m/s`,
    `g = ${format(r.gravity, 2)} m/s²`,
    `h = ${format(r.launch_height, 1)} m`,
  ].forEach((text) => {
    const span = document.createElement("span");
    span.textContent = text;
    ui.formulaVariables.appendChild(span);
  });
  ui.formulaSubstitution.textContent =
    `Waktu terbang = ${format(r.flight_time, 3)} s · Jarak = ${format(r.range, 2)} m · Tinggi puncak = ${format(r.max_height, 2)} m`;
  ui.formulaSteps.replaceChildren();
  [
    "Uraikan kecepatan awal menjadi komponen horizontal dan vertikal.",
    "Hitung posisi horizontal dengan x(t) = Vx × t.",
    "Hitung posisi vertikal dengan y(t) = h + Vy × t − ½gt².",
    "Waktu pendaratan terjadi ketika posisi vertikal y(t) = 0.",
  ].forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    ui.formulaSteps.appendChild(li);
  });
  ui.formulaAnswer.textContent = `${format(r.range, 2)} m · ${format(r.flight_time, 3)} s`;
  ui.formulaNote.textContent = "Model ideal: hambatan udara diabaikan. Nilai hasil dihitung oleh backend Python.";
  ui.questionSourceNote.textContent = "Bagian ini menampilkan persamaan umum untuk eksperimen bebas, bukan jawaban soal buku.";
}

function renderChallengeResult() {
  if (!state.result) return;
  const target = Number(ui.target.value);
  const difference = state.result.range - target;
  const tolerance = Math.max(1, target * 0.05);
  const close = Math.abs(difference) <= tolerance;
  ui.challengeResult.classList.remove("hidden");
  ui.challengeResult.textContent = close
    ? `🎯 Tepat sasaran! Jarak ${format(state.result.range, 1)} m dekat dengan target ${target} m.`
    : difference < 0
      ? `↗ Kurang jauh ${format(Math.abs(difference), 1)} m. Coba naikkan kecepatan atau ubah sudut.`
      : `↘ Terlalu jauh ${format(difference, 1)} m. Sesuaikan sudut atau kecepatan.`;
}

function renderInsight() {
  const r = state.result;
  if (!r) return;
  const angle = Number(r.angle);
  const speed = Number(r.speed);
  const g = Number(r.gravity);
  const range = Number(r.range);
  const height = Number(r.max_height);
  const time = Number(r.flight_time);
  let title = "Apa arti hasil simulasi?";
  let text = "";
  let points = [];
  let tip = "Coba ubah satu parameter saja agar pengaruhnya mudah diamati.";

  if (state.mode === "assignment") {
    if (state.question === 1) {
      const ideal45 = (speed ** 2) / g;
      const ratio = ideal45 > 0 ? (range / ideal45) * 100 : 0;
      title = "Analisis jarak horizontal";
      text = `Dengan sudut ${angle}° dan kecepatan ${speed} m/s, Boro menempuh ${format(range, 2)} m.`;
      points = [
        `Jarak ideal pada 45° untuk V dan g yang sama adalah ${format(ideal45, 2)} m.`,
        `Hasil saat ini sekitar ${format(ratio, 1)}% dari jarak ideal 45° pada kondisi awal dan akhir setinggi sama.`,
        angle < 45 ? "Sudut masih di bawah 45°: komponen mendatar relatif besar, tetapi waktu naik lebih singkat." :
          angle > 45 ? "Sudut di atas 45°: Boro naik lebih tinggi, tetapi komponen mendatarnya lebih kecil." :
          "Sudut 45° menyeimbangkan komponen horizontal dan vertikal untuk jarak maksimum pada tinggi awal dan akhir sama.",
      ];
      tip = "Coba bandingkan 30°, 45°, dan 60° dengan kecepatan yang sama.";
    } else if (state.question === 2) {
      title = "Analisis tinggi maksimum";
      text = `Boro naik ${format(r.rise_height, 2)} m dari titik peluncuran dan mencapai ${format(height, 2)} m dari tanah.`;
      points = [
        `Komponen kecepatan vertikal awal adalah ${format(r.vy, 2)} m/s.`,
        "Semakin besar komponen vertikal, semakin tinggi titik puncak lintasan.",
        `Gravitasi ${format(g, 2)} m/s² memperlambat gerak ke atas hingga Vy menjadi 0 m/s di puncak.`,
      ];
      tip = "Naikkan sudut mendekati 90° untuk melihat tinggi puncak bertambah.";
    } else if (state.question === 3) {
      title = "Analisis waktu terbang";
      text = `Boro berada di udara selama ${format(time, 3)} detik sebelum menyentuh tanah.`;
      points = [
        `Komponen vertikal awal Vy = ${format(r.vy, 2)} m/s.`,
        `Pada tinggi awal dan akhir sama, waktu naik dan turun simetris.`,
        `Kecepatan horizontal Vx = ${format(r.vx, 2)} m/s memengaruhi jarak, bukan waktu naik-turun pada model ini.`,
      ];
      tip = "Ubah sudut tanpa mengubah kecepatan untuk melihat perubahan waktu di udara.";
    } else {
      title = "Analisis komponen kecepatan";
      text = `Kecepatan ${speed} m/s terbagi menjadi Vx ${format(r.vx, 2)} m/s dan Vy ${format(r.vy, 2)} m/s.`;
      points = [
        `Vx = V cos θ = ${format(r.vx, 2)} m/s; komponen ini tetap jika hambatan udara diabaikan.`,
        `Vy = V sin θ = ${format(r.vy, 2)} m/s; komponen ini berubah karena gravitasi.`,
        `Besar kecepatan awal merupakan gabungan kedua komponen tersebut.`,
      ];
      tip = "Ubah sudut dan amati bagaimana Vx dan Vy saling berubah.";
    }
  } else if (state.mode === "lab") {
    title = "Analisis eksperimen bebas";
    text = `Dengan gravitasi ${format(g, 2)} m/s² dan tinggi awal ${format(r.launch_height, 1)} m, Boro menempuh ${format(range, 2)} m.`;
    points = [
      `Waktu terbang ${format(time, 3)} s; gravitasi lebih kecil umumnya membuat waktu gerak lebih lama.`,
      `Puncak lintasan berada ${format(height, 2)} m dari tanah.`,
      `Komponen kecepatan: Vx ${format(r.vx, 2)} m/s dan Vy ${format(r.vy, 2)} m/s.`,
    ];
    tip = "Bandingkan nilai gravitasi Bulan, Mars, Bumi, dan Jupiter dengan sudut serta kecepatan tetap.";
  } else if (state.mode === "compare") {
    const best = state.comparisons.reduce((a, b) => a.range > b.range ? a : b, state.comparisons[0] || r);
    title = "Sudut dengan jarak terbesar";
    text = `Dalam enam sudut yang dibandingkan, ${best.angle}° menghasilkan jarak terbesar yaitu ${format(best.range, 2)} m.`;
    points = [
      `Kecepatan awal semua lintasan sama, yaitu ${speed} m/s.`,
      `Jarak pada sudut ${angle}° adalah ${format(range, 2)} m.`,
      "Untuk titik awal dan akhir setinggi sama pada model ideal, sudut terbaik secara teori adalah 45°.",
    ];
    tip = "Ubah kecepatan, lalu tekan Bandingkan lagi untuk memperbarui tabel.";
  } else {
    const target = Number(ui.target.value);
    const difference = range - target;
    title = "Analisis misi target";
    text = Math.abs(difference) <= Math.max(1, target * 0.05)
      ? `Boro berhasil mendekati target ${target} m dengan selisih ${format(Math.abs(difference), 2)} m.`
      : `Jarak aktual ${format(range, 2)} m, sedangkan target ${target} m. Selisihnya ${format(Math.abs(difference), 2)} m.`;
    points = [
      `Sudut peluncuran: ${angle}°; kecepatan awal: ${speed} m/s.`,
      difference < 0 ? "Lintasan belum mencapai target; tambah kecepatan atau ubah sudut." :
        difference > 0 ? "Lintasan melewati target; kurangi jarak dengan mengubah sudut atau kecepatan." :
        "Jarak hasil tepat sama dengan target.",
      "Keberhasilan menggunakan toleransi 5% dari target atau minimal 1 meter.",
    ];
    tip = "Ubah satu parameter setiap percobaan agar kamu tahu perubahan mana yang paling berpengaruh.";
  }

  ui.insightTitle.textContent = title;
  ui.insightText.textContent = text;
  ui.insightPoints.replaceChildren();
  points.forEach((point, index) => {
    const row = document.createElement("div");
    const number = document.createElement("span");
    const paragraph = document.createElement("p");
    number.textContent = String(index + 1).padStart(2, "0");
    paragraph.textContent = point;
    row.append(number, paragraph);
    ui.insightPoints.appendChild(row);
  });
  ui.insightTip.textContent = tip;
}

function renderComparison() {
  ui.comparisonBody.replaceChildren();
  if (!state.comparisons.length) return;
  const best = state.comparisons.reduce((a, b) => a.range > b.range ? a : b);
  state.comparisons.forEach((item) => {
    const row = document.createElement("tr");
    if (item.angle === best.angle) row.className = "best-row";
    [ `${item.angle}°${item.angle === best.angle ? " ★" : ""}`,
      `${format(item.range, 2)} m`,
      `${format(item.max_height, 2)} m`,
      `${format(item.flight_time, 3)} s` ].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });
    ui.comparisonBody.appendChild(row);
  });
  ui.comparisonFootnote.textContent =
    `Jarak terbesar pada percobaan ini: sudut ${best.angle}° dengan jarak ${format(best.range, 2)} m.`;
}

function updateQuestionContent() {
  const question = QUESTIONS[state.question];
  document.querySelectorAll(".question-tab").forEach((button) => {
    const active = Number(button.dataset.question) === state.question;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  ui.stageMode.textContent = question.badge;
  ui.problemTitle.textContent = question.problemTitle;
  ui.problemSubtitle.textContent = state.question === 1
    ? "Soal pengayaan untuk memperluas pemahaman gerak parabola"
    : "Soal pengayaan untuk memperluas pemahaman gerak parabola";
  ui.problemDescription.textContent = question.problemDescription;
  ui.problemAssumptions.textContent = question.assumptions;
  ui.questionPicker.classList.toggle("hidden", state.mode !== "assignment");
}

function setMode(mode, shouldRefresh = true) {
  state.mode = mode;
  state.progress = 0;
  state.playing = false;
  state.lastFrame = 0;

  document.querySelectorAll(".mode-tab").forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".lab-only").forEach((element) => {
    element.classList.toggle("hidden", mode !== "lab");
  });
  document.querySelectorAll(".challenge-only").forEach((element) => {
    element.classList.toggle("hidden", mode !== "challenge");
  });
  ui.fixedGravity.classList.toggle("hidden", mode === "lab");
  ui.compareSection.classList.toggle("hidden", mode !== "compare");
  ui.challengeResult.classList.toggle("hidden", mode !== "challenge");
  ui.questionPicker.classList.toggle("hidden", mode !== "assignment");

  const descriptions = {
    assignment: {
      title: `Soal ${state.question} · ${QUESTIONS[state.question].title}`,
      text: state.question === 1
        ? "Soal dari proyek: hitung jarak horizontal dengan gravitasi tetap 10 m/s²."
        : "Mode pengayaan: rumus dan langkah penyelesaian berubah sesuai soal yang dipilih.",
      badge: QUESTIONS[state.question].badge,
    },
    lab: {
      title: "Mode eksplorasi bebas",
      text: "Ubah gravitasi planet dan tinggi awal untuk melihat perbedaan gerak.",
      badge: "LAB BEBAS",
    },
    compare: {
      title: "Mode perbandingan sudut",
      text: "Bandingkan enam sudut dengan kecepatan awal yang sama.",
      badge: "ANGLE STUDY",
    },
    challenge: {
      title: "Mode tantangan target",
      text: "Atur sudut dan kecepatan agar jarak pendaratan mendekati target.",
      badge: "CHALLENGE",
    },
  };
  const description = descriptions[mode];
  const strong = document.createElement("strong");
  const span = document.createElement("span");
  strong.textContent = description.title;
  span.textContent = description.text;
  ui.modeDescription.replaceChildren(strong, span);
  ui.stageMode.textContent = description.badge;

  if (mode !== "lab") {
    ui.gravity.value = "10";
    ui.launchHeight.value = "0";
  }
  updateLabels();
  if (shouldRefresh) refreshSimulation(false);
}

function setQuestion(questionNumber) {
  state.question = Number(questionNumber);
  state.progress = 0;
  state.playing = false;
  updateQuestionContent();
  if (state.mode === "assignment") {
    setMode("assignment");
  } else {
    renderInsight();
  }
}

function renderProblemSample() {
  if (state.solution) ui.problemSampleResult.textContent = `Hasil saat ini: ${state.solution.answer}.`;
}

/* ===== RIWAYAT EKSPERIMEN (localStorage) ===== */
function loadHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    state.history = Array.isArray(stored) ? stored : [];
  } catch {
    state.history = [];
  }
  renderHistory();
}

function persistHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
  } catch {
    setCallout("Penyimpanan browser penuh atau tidak tersedia. Hasil belum bisa disimpan.");
  }
}

function currentAnswerSummary() {
  if (state.mode === "assignment" && state.solution) return state.solution.answer;
  if (state.mode === "challenge") return `${format(state.result.range, 2)} m dari target ${ui.target.value} m`;
  return `${format(state.result.range, 2)} m`;
}

function saveExperiment() {
  if (!state.result) return;
  const p = params();
  const record = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    mode: state.mode,
    question: state.question,
    angle: p.angle,
    speed: p.speed,
    gravity: p.gravity,
    launch_height: p.launch_height,
    target: Number(ui.target.value),
    skin: state.skin,
    result: state.result,
    answer: currentAnswerSummary(),
  };
  state.history.unshift(record);
  state.history = state.history.slice(0, 30);
  persistHistory();
  renderHistory();
  setCallout("Hasil eksperimen tersimpan di riwayat browser.");
}

function renderHistory() {
  ui.historyList.replaceChildren();
  ui.historyEmpty.classList.toggle("hidden", state.history.length > 0);
  state.history.forEach((record) => {
    const card = document.createElement("article");
    card.className = "history-item";

    const top = document.createElement("div");
    top.className = "history-item-top";
    const heading = document.createElement("h3");
    heading.textContent = record.mode === "assignment"
      ? `Soal ${record.question} · ${QUESTIONS[record.question]?.title || "Eksperimen"}`
      : record.mode === "lab" ? "Lab bebas" : record.mode === "compare" ? "Bandingkan sudut" : "Tantangan target";
    const time = document.createElement("time");
    const date = new Date(record.createdAt);
    time.textContent = Number.isNaN(date.getTime()) ? "Waktu tidak tersedia" :
      date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
    top.append(heading, time);

    const meta = document.createElement("div");
    meta.className = "history-meta";
    [`${record.angle}°`, `${record.speed} m/s`, `g ${format(record.gravity, 2)}`, `h ${record.launch_height} m`].forEach((value) => {
      const chip = document.createElement("span");
      chip.textContent = value;
      meta.appendChild(chip);
    });
    const result = document.createElement("p");
    result.className = "history-result";
    result.textContent = `Hasil: ${record.answer}`;
    const actions = document.createElement("div");
    actions.className = "history-actions";
    const restore = document.createElement("button");
    restore.type = "button";
    restore.dataset.action = "restore";
    restore.dataset.id = record.id;
    restore.textContent = "Buka kembali";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-history";
    remove.dataset.action = "delete";
    remove.dataset.id = record.id;
    remove.textContent = "Hapus";
    actions.append(restore, remove);
    card.append(top, meta, result, actions);
    ui.historyList.appendChild(card);
  });
}

function restoreExperiment(id) {
  const record = state.history.find((item) => item.id === id);
  if (!record) return;
  state.question = Number(record.question) || 1;
  ui.angle.value = String(record.angle);
  ui.speed.value = String(record.speed);
  ui.gravity.value = String(record.gravity);
  ui.launchHeight.value = String(record.launch_height);
  ui.target.value = String(record.target || 10);
  if (record.skin) setSkin(record.skin, false);
  updateQuestionContent();
  setMode(record.mode || "assignment");
  $("simulationWorkspace").scrollIntoView({ behavior: "smooth", block: "start" });
  setCallout("Parameter eksperimen sebelumnya sudah dipulihkan.");
}

ui.historyList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "restore") restoreExperiment(button.dataset.id);
  if (button.dataset.action === "delete") {
    state.history = state.history.filter((item) => item.id !== button.dataset.id);
    persistHistory();
    renderHistory();
  }
});

$("clearHistoryBtn").addEventListener("click", () => {
  if (!state.history.length) return;
  if (!window.confirm("Hapus semua riwayat eksperimen di browser ini?")) return;
  state.history = [];
  persistHistory();
  renderHistory();
});

/* ===== TUTORIAL INTERAKTIF ===== */
const tutorialSteps = [
  {
    title: "1. Pilih soal yang ingin dipelajari",
    text: "Pilih Soal 1 sampai Soal 4. Rumus, substitusi angka, dan langkah penyelesaian di Formula Corner akan berubah mengikuti pilihanmu.",
    targets: ["questionPicker"],
  },
  {
    title: "2. Atur sudut dan kecepatan",
    text: "Geser pengatur Sudut Peluncuran dan Kecepatan Awal. Untuk mencoba contoh dari proyek, gunakan sudut 37° dan kecepatan 10 m/s.",
    targets: ["angleControl", "speedControl"],
  },
  {
    title: "3. Jalankan simulasi",
    text: "Tekan tombol Hitung & Luncurkan Boro. Angka hasil, lintasan, rumus, dan Flight Insight akan diperbarui dengan parameter yang sama.",
    targets: ["launchBtn", "flightCanvas"],
  },
  {
    title: "4. Baca rumus dan langkahnya",
    text: "Lihat Formula Corner untuk rumus, arti variabel, substitusi angka, langkah penyelesaian, dan hasil akhir. Soal 2–4 adalah soal pengayaan.",
    targets: ["formulaCard"],
  },
  {
    title: "5. Simpan dan buka eksperimen",
    text: "Setiap kali kamu menekan Hitung & Luncurkan Boro, hasil tersimpan di Riwayat Eksperimen. Gunakan Buka kembali untuk memulihkan parameter.",
    targets: ["experimentHistory"],
  },
];

function clearTutorialHighlights() {
  document.querySelectorAll(".highlight-target").forEach((element) => {
    element.classList.remove("highlight-target");
  });
}

function renderTutorial() {
  clearTutorialHighlights();
  const active = state.tutorialActive && state.tutorialStep >= 0;
  // FLOATING TUTORIAL NAVIGATION
const dock = $("tutorialDock");

if (dock) {
  dock.classList.toggle("hidden", !active);

  if (active) {
    const currentStep = tutorialSteps[state.tutorialStep];

    const isLastStep =
      state.tutorialStep === tutorialSteps.length - 1;

    $("tutorialDockStep").textContent =
      `Langkah ${state.tutorialStep + 1} dari ${tutorialSteps.length}`;

    $("tutorialDockTitle").textContent =
      currentStep.title;

    $("tutorialDockPrev").classList.toggle(
      "hidden",
      state.tutorialStep === 0
    );

    $("tutorialDockNext").classList.toggle(
      "hidden",
      isLastStep
    );

    $("tutorialDockFinish").classList.toggle(
      "hidden",
      !isLastStep
    );
  }
}
  $("tutorialStart").classList.toggle("hidden", active);
  $("tutorialPrev").classList.toggle("hidden", !active || state.tutorialStep === 0);
  $("tutorialNext").classList.toggle("hidden", !active || state.tutorialStep >= tutorialSteps.length - 1);
  $("tutorialFinish").classList.toggle("hidden", !active || state.tutorialStep !== tutorialSteps.length - 1);

  if (!active) {
    ui.tutorialTitle.textContent = "Mulai dari dasar";
    ui.tutorialText.textContent = "Ikuti panduan singkat untuk memilih soal, mengatur parameter, menjalankan Boro, dan membaca hasilnya.";
    ui.tutorialStepLabel.textContent = "Tutorial belum dimulai";
    ui.tutorialProgress.style.width = "0%";
    return;
  }

  const step = tutorialSteps[state.tutorialStep];
  ui.tutorialTitle.textContent = step.title;
  ui.tutorialText.textContent = step.text;
  ui.tutorialStepLabel.textContent = `Langkah ${state.tutorialStep + 1} dari ${tutorialSteps.length}`;
  ui.tutorialProgress.style.width = `${((state.tutorialStep + 1) / tutorialSteps.length) * 100}%`;
  step.targets.forEach((id) => {
    const target = $(id);
    if (target) target.classList.add("highlight-target");
  });
  const firstTarget = $(step.targets[0]);
  if (firstTarget) firstTarget.scrollIntoView({ behavior: "smooth", block: "center" });
}

function finishTutorial() {
  state.tutorialActive = false;
  state.tutorialStep = -1;
  clearTutorialHighlights();
  renderTutorial();
}

$("tutorialStart").addEventListener("click", () => {
  state.tutorialActive = true;
  state.tutorialStep = 0;
  renderTutorial();
});
$("tutorialPrev").addEventListener("click", () => {
  if (state.tutorialStep > 0) state.tutorialStep -= 1;
  renderTutorial();
});
$("tutorialNext").addEventListener("click", () => {
  if (state.tutorialStep < tutorialSteps.length - 1) state.tutorialStep += 1;
  renderTutorial();
});
$("tutorialFinish").addEventListener("click", finishTutorial);
$("tutorialDockPrev").addEventListener("click", () => {
  if (state.tutorialStep > 0) {
    state.tutorialStep--;
    renderTutorial();
  }
});

$("tutorialDockNext").addEventListener("click", () => {
  if (state.tutorialStep < tutorialSteps.length - 1) {
    state.tutorialStep++;
    renderTutorial();
  }
});

$("tutorialDockFinish").addEventListener("click", finishTutorial);

/* ===== GAMBARAN KANVAS DAN ANIMASI ===== */
function resizeCanvas() {
  if (!canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawScene();
}

function drawCloud(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.beginPath();
  ctx.arc(0, 9, 14, 0, Math.PI * 2);
  ctx.arc(15, 0, 19, 0, Math.PI * 2);
  ctx.arc(34, 9, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSlingshot(x, groundY) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#79523f";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-2, -2); ctx.lineTo(-2, -44);
  ctx.moveTo(-2, -42); ctx.lineTo(-20, -67);
  ctx.moveTo(-2, -42); ctx.lineTo(17, -70);
  ctx.stroke();
  ctx.strokeStyle = "#c28a5e";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-5, -4); ctx.lineTo(-5, -43);
  ctx.moveTo(-5, -43); ctx.lineTo(-22, -67);
  ctx.moveTo(-5, -43); ctx.lineTo(15, -70);
  ctx.stroke();
  ctx.restore();
}

function drawWatermelon(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#288b5c";
  ctx.strokeStyle = "#176c4c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 9, 17, 9, -0.12, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#8bd36e";
  ctx.lineWidth = 2;
  [-9, -3, 4, 10].forEach((offset) => {
    ctx.beginPath();
    ctx.moveTo(offset, 2);
    ctx.quadraticCurveTo(offset - 3, 9, offset, 16);
    ctx.stroke();
  });
  ctx.restore();
}

function drawBoro(x, y, scale = 1, tilt = 0) {
  const skins = {
    mint: { body: "#22a99d", outline: "#167b79", wing: "#55c9b6" },
    coral: { body: "#ee7a75", outline: "#bd5558", wing: "#ffb0a4" },
    violet: { body: "#8273dc", outline: "#5548b7", wing: "#b3a8f5" },
    gold: { body: "#e5ad44", outline: "#ad7622", wing: "#f7d27b" },
  };
  const skin = skins[state.skin] || skins.mint;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);
  drawWatermelon(0, 13, 0.95);
  ctx.fillStyle = "rgba(49,75,91,.12)";
  ctx.beginPath(); ctx.ellipse(0, 25, 19, 4, 0, 0, Math.PI * 2); ctx.fill();

  // Boro adalah maskot orisinal; paletnya berubah melalui pemilih kostum.
  ctx.fillStyle = skin.body;
  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(-1, -5, 14, 16, -.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin.wing;
  ctx.beginPath(); ctx.ellipse(-12, 0, 7, 10, -.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f0a34f";
  ctx.beginPath(); ctx.moveTo(-7, -18); ctx.lineTo(-12, -27); ctx.lineTo(-2, -21); ctx.fill();
  ctx.beginPath(); ctx.moveTo(1, -20); ctx.lineTo(3, -29); ctx.lineTo(8, -19); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(4, -10, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-5, -9, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#26344c";
  ctx.beginPath(); ctx.arc(5, -10, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-4, -9, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f3a64b";
  ctx.strokeStyle = "#c77b35";
  ctx.beginPath(); ctx.moveTo(11, -4); ctx.lineTo(22, 0); ctx.lineTo(10, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f18b7d";
  ctx.beginPath(); ctx.arc(-10, -2, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function worldToScreen(x, y, scale) {
  return { x: scale.left + x * scale.factor, y: scale.ground - y * scale.factor };
}

function drawScene() {
  if (!canvas || !ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  const fallback = {
    range: 9.6, max_height: 1.81, flight_time: 1.204,
    angle: 37, speed: 10, gravity: 10, launch_height: 0, vx: 7.99, vy: 6.02,
  };
  const r = state.result || fallback;
  const compareResults = state.mode === "compare" ? state.comparisons : [];
  const allResults = compareResults.length ? compareResults : [r];
  const target = state.mode === "challenge" ? Number(ui.target.value) : 0;

  // Skala otomatis menghitung seluruh jangkauan dan tinggi agar lintasan tidak terpotong.
  const maxRange = Math.max(...allResults.map((item) => Number(item.range) || 0), target, 5);
  const maxHeight = Math.max(...allResults.map((item) => Number(item.max_height) || 0), 3);
  const maxX = Math.max(maxRange * 1.16, 8);
  const maxY = Math.max(maxHeight * 1.25, 4);
  const left = 48, right = 42, top = 47, bottom = 48;
  const factorX = (width - left - right) / maxX;
  const factorY = (height - top - bottom) / maxY;
  const fitFactor = Math.max(0.1, Math.min(factorX, factorY));
  // Zoom hanya boleh diperkecil dari Fit; lintasan tetap utuh dan tidak terpotong.
  const factor = fitFactor * Math.min(1, Math.max(0.55, state.zoom));
  $("scaleLabel").textContent = state.zoom >= 0.999 ? "AUTO FIT" : `ZOOM ${Math.round(state.zoom * 100)}%`;
  const plotWidth = width - left - right;
  const ground = height - bottom;
  const scale = { left, ground, factor, plotWidth };
  const pointAt = (time, result) => {
    const x = result.vx * time;
    const y = Math.max(0, result.launch_height + result.vy * time - 0.5 * result.gravity * time * time);
    return worldToScreen(x, y, scale);
  };

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#9dd6ef");
  sky.addColorStop(0.68, "#d8eff8");
  sky.addColorStop(1, "#f1f8f5");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,223,143,.85)";
  ctx.beginPath(); ctx.arc(width - 75, 64, 24, 0, Math.PI * 2); ctx.fill();
  drawCloud(width * 0.24, 60, 0.72);
  drawCloud(width * 0.64, 42, 0.82);
  drawCloud(width * 0.83, 112, 0.62);

  ctx.fillStyle = "#b9e5d8";
  ctx.beginPath();
  ctx.moveTo(0, ground - 28);
  ctx.quadraticCurveTo(width * 0.23, ground - 76, width * 0.45, ground - 28);
  ctx.quadraticCurveTo(width * 0.75, ground - 82, width, ground - 25);
  ctx.lineTo(width, ground); ctx.lineTo(0, ground); ctx.closePath(); ctx.fill();

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
  ctx.font = "9px 'Courier New', monospace";
  ctx.fillText("JARAK (m)", width - 78, height - 10);
  ctx.restore();

  ctx.fillStyle = "#64c7a4";
  ctx.fillRect(0, ground, width, height - ground);
  ctx.fillStyle = "#2fa888";
  ctx.fillRect(0, ground, width, 5);
  for (let x = 8; x < width; x += 18) {
    ctx.fillStyle = "#2d9f83";
    ctx.beginPath(); ctx.moveTo(x, ground - 1); ctx.lineTo(x + 4, ground - 9); ctx.lineTo(x + 8, ground - 1); ctx.fill();
  }

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
    ctx.font = "bold 9px 'Courier New', monospace";
    ctx.fillText("TARGET", Math.min(targetX + 4, width - 55), ground - 70);
    ctx.restore();
  }

  if (state.mode === "compare" && compareResults.length) {
    compareResults.forEach((item, index) => {
      ctx.beginPath();
      ctx.strokeStyle = ANGLE_COLORS[index % ANGLE_COLORS.length];
      ctx.globalAlpha = 0.82;
      ctx.lineWidth = 2.2;
      const steps = 65;
      for (let i = 0; i <= steps; i++) {
        const point = pointAt(item.flight_time * i / steps, item);
        if (i === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  } else if (state.showTrail) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#ed777d";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(237,119,125,.25)";
    ctx.shadowBlur = 7;
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const point = pointAt(r.flight_time * i / steps, r);
      if (i === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  const launchPoint = worldToScreen(0, r.launch_height, scale);
  drawSlingshot(launchPoint.x - 7, ground + 2);

  const peak = worldToScreen(r.vx * (r.vy / Math.max(r.gravity, 0.0001)), r.max_height, scale);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#ed777d";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(peak.x, peak.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#5d587f";
  ctx.font = "bold 9px 'Courier New', monospace";
  ctx.fillText("PUNCAK", Math.min(peak.x + 8, width - 58), Math.max(peak.y - 10, 15));

  const currentTime = r.flight_time * state.progress;
  const current = pointAt(currentTime, r);
  const slope = Math.atan2(-(r.vy - r.gravity * currentTime), r.vx || 0.0001);
  drawBoro(current.x, current.y - 10, 1, slope * 0.15);

  const end = worldToScreen(r.range, 0, scale);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#ed777d";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(end.x, ground - 4, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#476c76";
  ctx.font = "bold 9px 'Courier New', monospace";
  const labelX = Math.min(Math.max(left + 5, end.x - 42), width - 65);
  ctx.fillText(`${format(r.range, 1)} m`, labelX, ground - 15);
}

function animationLoop(timestamp) {
  if (state.playing && state.result) {
    if (!state.lastFrame) state.lastFrame = timestamp;
    const delta = Math.max(0, (timestamp - state.lastFrame) / 1000);
    const duration = Math.max(state.result.flight_time, 0.25);
    state.progress += (delta / duration) * state.playSpeed;
    if (state.progress >= 1) {
      state.progress = 1;
      state.playing = false;
      setCallout("Boro sudah mendarat. Tekan Kembali atau ubah parameter untuk mencoba lagi.");
    }
  }
  state.lastFrame = timestamp;
  drawScene();
  requestAnimationFrame(animationLoop);
}

function setSkin(skin, persist = true) {
  const validSkins = ["mint", "coral", "violet", "gold"];
  state.skin = validSkins.includes(skin) ? skin : "mint";
  document.querySelectorAll(".skin-option").forEach((button) => {
    button.classList.toggle("selected", button.dataset.skin === state.skin);
  });
  const filters = {
    mint: "none",
    coral: "hue-rotate(115deg) saturate(1.12)",
    violet: "hue-rotate(205deg) saturate(1.05)",
    gold: "hue-rotate(300deg) saturate(1.1)",
  };
  const sticker = document.querySelector(".sticker-bird");
  if (sticker) sticker.style.filter = filters[state.skin];
  if (persist) {
    try { localStorage.setItem("flightLab.skin.v1", state.skin); } catch { /* optional preference */ }
  }
  drawScene();
}

/* ===== EVENT LISTENERS ===== */
document.querySelectorAll(".mode-tab").forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});
document.querySelectorAll(".question-tab").forEach((tab) => {
  tab.addEventListener("click", () => setQuestion(tab.dataset.question));
});

[ui.angle, ui.speed, ui.gravity, ui.launchHeight, ui.target].forEach((input) => {
  input.addEventListener("input", () => {
    updateLabels();
    refreshSimulation(false);
  });
});

document.querySelectorAll("[data-gravity]").forEach((button) => {
  button.addEventListener("click", () => {
    ui.gravity.value = button.dataset.gravity;
    document.querySelectorAll("[data-gravity]").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    refreshSimulation(false);
  });
});

$("launchBtn").addEventListener("click", () => refreshSimulation(true, true));
$("playBtn").addEventListener("click", () => {
  if (!state.result) {
    refreshSimulation(true);
    return;
  }
  if (state.progress >= 1) state.progress = 0;
  state.playing = true;
  state.lastFrame = 0;
  setCallout("Boro mulai terbang!");
});
$("pauseBtn").addEventListener("click", () => {
  state.playing = false;
  setCallout("Animasi dijeda. Tekan Mulai untuk melanjutkan.");
});
$("backBtn").addEventListener("click", () => {
  state.playing = false;
  state.progress = 0;
  state.lastFrame = 0;
  setCallout("Boro kembali ke titik awal. Tekan Mulai untuk menjalankan lagi.");
  drawScene();
});
$("trailToggle").addEventListener("change", (event) => {
  state.showTrail = event.target.checked;
  drawScene();
});
$("playSpeed").addEventListener("change", (event) => {
  state.playSpeed = Number(event.target.value) || 1;
});
$("zoomOutBtn").addEventListener("click", () => {
  state.zoom = Math.max(0.55, state.zoom - 0.1);
  drawScene();
});
$("zoomInBtn").addEventListener("click", () => {
  state.zoom = Math.min(1, state.zoom + 0.1);
  drawScene();
});
$("fitBtn").addEventListener("click", () => {
  state.zoom = 1;
  drawScene();
});
document.querySelectorAll(".skin-option").forEach((button) => {
  button.addEventListener("click", () => setSkin(button.dataset.skin));
});

window.addEventListener("resize", resizeCanvas);
document.addEventListener("visibilitychange", () => { state.lastFrame = 0; });

// Inisialisasi: contoh dari proyek Soal 1.
updateLabels();
updateQuestionContent();
setMode("assignment", false);
loadHistory();
renderTutorial();
let savedSkin = "mint";
try { savedSkin = localStorage.getItem("flightLab.skin.v1") || "mint"; } catch { /* optional preference */ }
setSkin(savedSkin, false);
resizeCanvas();
refreshSimulation(false);
requestAnimationFrame(animationLoop);
