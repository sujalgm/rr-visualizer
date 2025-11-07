// ---------------------------------------------------------------
// Round Robin CPU Scheduling Visualizer
// Includes: Step Back button + IDLE block display
// ---------------------------------------------------------------

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
let playing = false;
let rafId = null;
let state = null;
let history = [];

const byId = (id) => document.getElementById(id);

// ---------------------------------------------------------------
// INITIALIZE ENGINE
// ---------------------------------------------------------------
function initEngine() {
  const tq = parseInt(byId("tq").value);
  const rows = Array.from(document.querySelectorAll("tbody tr"));
  const processes = rows.map((r) => {
    const c = r.querySelectorAll("td");
    return {
      pid: c[0].textContent.trim(),
      arrival: parseInt(c[1].textContent),
      burst: parseInt(c[2].textContent),
      priority: parseInt(c[3].textContent),
      remaining: parseInt(c[2].textContent),
      color: randColor(),
    };
  });

  state = { clock: 0, tq, processes, queue: [], blocks: [], trace: [], running: null };
  history = [];
  playing = false;
  cancelAnimationFrame(rafId);
  draw();
  updateStats();
  logClear();
  logMsg("⚙️ Engine initialized. Ready to start.");
}

// ---------------------------------------------------------------
// MAIN ROUND ROBIN STEP
// ---------------------------------------------------------------
function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function stepTick(s) {
  history.push(clone(s));

  // 1️⃣ Try to start a process if ready
  if (!s.running && s.queue.length > 0) {
    s.running = s.queue.shift();
    s.runningStart = s.clock;
    s.runningEnd = Math.min(s.clock + s.tq, s.clock + s.running.remaining);
    logMsg(`▶️ Running ${s.running.pid}`);
  }

  // 2️⃣ Execute or idle
  if (s.running) {
    s.running.remaining -= 1;
    s.clock++;

    if (s.running.remaining <= 0) {
      logMsg(`✅ ${s.running.pid} finished`);
      s.blocks.push({ pid: s.running.pid, start: s.runningStart, end: s.clock });
      s.running = null;
    } else if (s.clock >= s.runningEnd) {
      logMsg(`⏳ Quantum expired for ${s.running.pid}`);
      s.queue.push(s.running);
      s.blocks.push({ pid: s.running.pid, start: s.runningStart, end: s.runningEnd });
      s.running = null;
    }
  } else {
    // 💤 CPU Idle tick
    const last = s.blocks[s.blocks.length - 1];
    if (last && last.pid === "IDLE") last.end += 1;
    else s.blocks.push({ pid: "IDLE", start: s.clock, end: s.clock + 1 });
    logMsg("💤 CPU idle");
    s.clock++;
  }

  // 3️⃣ Add new arrivals *after* clock increments (to allow idle gaps)
  s.processes.forEach((p) => {
    if (p.arrival === s.clock) {
      s.queue.push(p);
      logMsg(`📥 Process ${p.pid} arrived`);
    }
  });

  s.trace.push({
    time: s.clock,
    event: s.running ? "RUNNING" : "IDLE",
    pid: s.running ? s.running.pid : "IDLE",
  });

  return s.processes.every((p) => p.remaining <= 0);
}

// ---------------------------------------------------------------
// STEP BACK FUNCTION
// ---------------------------------------------------------------
function stepBack() {
  if (history.length === 0) {
    logMsg("⛔ No previous step to revert to.");
    return;
  }
  state = history.pop();
  draw();
  updateStats();
  logMsg("⏮ Reverted one step back.");
}

// ---------------------------------------------------------------
// PLAY LOOP
// ---------------------------------------------------------------
function playLoop() {
  if (!state) return;
  const done = stepTick(state);
  draw();
  updateStats();
  if (done) {
    playing = false;
    cancelAnimationFrame(rafId);
    logMsg("🏁 All processes completed.");
    return;
  }
  if (playing) rafId = requestAnimationFrame(playLoop);
}

// ---------------------------------------------------------------
// DRAWING SECTION
// ---------------------------------------------------------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0b1028";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const baseX = 30, baseY = 30, w = 1100, h = 100;
  roundRect(ctx, baseX, baseY, w, h, 14, "#0c1340", "#26357a");
  text("Gantt Chart", baseX + 12, baseY + 22, 14, "#9fb0ff");

  if (!state) return;
  const maxT = Math.max(state.clock + 1, totalBurst() + maxArrival());
  const chartX = baseX + 12, chartY = baseY + 36, chartW = w - 24, chartH = 70;

  // grid lines
  ctx.strokeStyle = "#1b2555";
  for (let t = 0; t <= maxT; t++) {
    const x = chartX + (t / maxT) * chartW;
    ctx.beginPath();
    ctx.moveTo(x, chartY);
    ctx.lineTo(x, chartY + chartH);
    ctx.stroke();
  }

  // process blocks
  state.blocks.forEach((b) => {
    if (b.pid === "IDLE") return;
    const p = state.processes.find((pp) => pp.pid === b.pid);
    const x1 = chartX + (b.start / maxT) * chartW;
    const x2 = chartX + (b.end / maxT) * chartW;
    const width = Math.max(3, x2 - x1);
    roundRect(ctx, x1, chartY + 6, width, chartH - 12, 8, shade(p.color, 0.18), p.color);
    text(p.pid, x1 + 6, chartY + chartH / 2 + 4, 12, "#0b1020");
  });

  // idle blocks
  state.blocks.forEach((b) => {
    if (b.pid !== "IDLE") return;
    const x1 = chartX + (b.start / maxT) * chartW;
    const x2 = chartX + (b.end / maxT) * chartW;
    const width = Math.max(6, x2 - x1);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#b0baff";
    ctx.fillStyle = "rgba(180,190,255,0.2)";
    ctx.fillRect(x1, chartY + 2, width, chartH - 4);
    ctx.strokeRect(x1, chartY + 2, width, chartH - 4);
    text("IDLE", x1 + width / 4, chartY + chartH / 2 + 4, 11, "#ccd5ff");
  });

  text(`Clock: ${state.clock}`, chartX, chartY + chartH + 16, 13, "#9fb0ff");
}

// ---------------------------------------------------------------
// STATS + LOGGING
// ---------------------------------------------------------------
function totalBurst() {
  return state.processes.reduce((s, p) => s + p.burst, 0);
}
function maxArrival() {
  return Math.max(...state.processes.map((p) => p.arrival));
}
function computeStats(s) {
  const completed = s.blocks.reduce((acc, b) => {
    if (b.pid === "IDLE") return acc;
    const p = s.processes.find((x) => x.pid === b.pid);
    if (!acc[p.pid]) acc[p.pid] = { start: b.start, end: b.end, burst: p.burst };
    else acc[p.pid].end = b.end;
    return acc;
  }, {});
  const c = Object.keys(completed).length;
  if (c === 0) return { awt: 0, atat: 0, throughput: 0, cpuUtil: 0 };
  let twt = 0, ttat = 0, tburst = 0;
  for (const pid in completed) {
    const x = completed[pid];
    const arr = s.processes.find((p) => p.pid === pid).arrival;
    ttat += x.end - arr;
    twt += ttat - x.burst;
    tburst += x.burst;
  }
  return { awt: twt / c, atat: ttat / c, throughput: c / s.clock, cpuUtil: (tburst / s.clock) * 100 };
}
function updateStats() {
  const s = computeStats(state);
  byId("statAWT").textContent = s.awt.toFixed(2);
  byId("statATAT").textContent = s.atat.toFixed(2);
  byId("statTH").textContent = s.throughput.toFixed(2) + "/t";
  byId("statCPU").textContent = s.cpuUtil.toFixed(1) + "%";
}
function logMsg(m) {
  const box = byId("log");
  box.textContent += `t=${state.clock}: ${m}\n`;
  box.scrollTop = box.scrollHeight;
}
function logClear() { byId("log").textContent = ""; }

// ---------------------------------------------------------------
// CANVAS HELPERS
// ---------------------------------------------------------------
function roundRect(c, x, y, w, h, r, fill, stroke) {
  c.fillStyle = fill; c.strokeStyle = stroke;
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
  c.fill();
  c.stroke();
}
function text(t, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.font = `${size}px ui-sans-serif`;
  ctx.fillText(t, x, y);
}
function shade(hex, amt) {
  const c = parseInt(hex.slice(1), 16);
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function randColor() {
  const arr = ["#4fc3f7", "#81c784", "#ba68c8", "#ffb74d", "#e57373"];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------
// BUTTONS
// ---------------------------------------------------------------
const tableBody = document.querySelector("tbody");
function addRow(pid, a, b, pr) {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${pid}</td><td contenteditable="true">${a}</td><td contenteditable="true">${b}</td><td contenteditable="true">${pr}</td>`;
  tableBody.appendChild(tr);
}
byId("btnAdd").onclick = () => {
  const n = tableBody.querySelectorAll("tr").length;
  addRow(`P${n + 1}`, n * 2, 5, 1);
};
byId("btnClear").onclick = () => (tableBody.innerHTML = "");
byId("btnBuild").onclick = () => initEngine();
byId("btnPlay").onclick = () => { if (!state) return; playing = true; playLoop(); };
byId("btnPause").onclick = () => { playing = false; cancelAnimationFrame(rafId); };
byId("btnStep").onclick = () => { playing = false; if (!state) return; stepTick(state); draw(); updateStats(); };
byId("btnStepBack").onclick = () => { playing = false; stepBack(); };
byId("btnReset").onclick = () => { playing = false; initEngine(); };
byId("btnExportPNG").onclick = () => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "rr_screenshot.png";
  a.click();
};
byId("btnExportCSV").onclick = () => {
  const rows = ["time,event,pid"];
  state.trace.forEach((t) => rows.push(`${t.time},${t.event},${t.pid}`));
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "rr_trace.csv";
  a.click();
};

// Default demo processes
addRow("P1", 0, 3, 1);
addRow("P2", 5, 2, 1);
addRow("P3", 8, 4, 1);
