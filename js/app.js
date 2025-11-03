// ---------------------------------------------------------------
// Round Robin CPU Scheduling Visualizer (with Step Back support)
// ---------------------------------------------------------------

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
let playing = false;
let rafId = null;
let state = null;
let history = []; // store states for Step Back

const byId = (id) => document.getElementById(id);

// ---------------------------------------------------------------
// ENGINE INITIALIZATION
// ---------------------------------------------------------------
function initEngine() {
  const tqInput = byId("tq");
  const tq = parseInt(tqInput.value);
  const rows = Array.from(document.querySelectorAll("tbody tr"));
  const processes = rows.map((r) => {
    const cells = r.querySelectorAll("td");
    return {
      pid: cells[0].textContent.trim(),
      arrival: parseInt(cells[1].textContent),
      burst: parseInt(cells[2].textContent),
      priority: parseInt(cells[3].textContent),
      remaining: parseInt(cells[2].textContent),
      color: randColor(),
    };
  });

  state = { clock: 0, tq, processes, queue: [], blocks: [], trace: [] };
  history = []; // clear old
  playing = false;
  cancelAnimationFrame(rafId);
  draw();
  updateStats();
  logClear();
  logMsg("⚙️ Engine initialized. Ready to start.");
}

// ---------------------------------------------------------------
// MAIN SIMULATION LOGIC
// ---------------------------------------------------------------
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function stepTick(s) {
  history.push(clone(s)); // Save snapshot before modifying

  s.processes.forEach((p) => {
    if (p.arrival === s.clock) {
      s.queue.push(p);
      logMsg(`📥 Process ${p.pid} arrived`);
    }
  });

  if (!s.running && s.queue.length > 0) {
    s.running = s.queue.shift();
    s.runningStart = s.clock;
    s.runningEnd = Math.min(s.clock + s.tq, s.clock + s.running.remaining);
    logMsg(`▶️ Running ${s.running.pid}`);
  }

  if (s.running) {
    s.running.remaining -= 1;
    s.clock += 1;

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
  } else s.clock += 1;

  s.trace.push({
    time: s.clock,
    event: s.running ? "RUNNING" : "IDLE",
    pid: s.running ? s.running.pid : null,
  });

  return s.processes.every((p) => p.remaining <= 0);
}

// ---------------------------------------------------------------
// STEP BACKWARD FUNCTION
// ---------------------------------------------------------------
function stepBack() {
  if (history.length === 0) {
    logMsg("⛔ No previous step to revert to.");
    return;
  }
  state = history.pop(); // revert
  draw();
  updateStats();
  logMsg("⏮ Reverted one step back.");
}

// ---------------------------------------------------------------
// PLAY LOOP
// ---------------------------------------------------------------
function playLoop() {
  if (!state) return;
  const allDone = stepTick(state);
  draw();
  updateStats();
  if (allDone) {
    playing = false;
    cancelAnimationFrame(rafId);
    logMsg("🏁 All processes completed.");
    updateStats();
    return;
  }
  if (playing) rafId = requestAnimationFrame(playLoop);
}

// ---------------------------------------------------------------
// CANVAS DRAWING
// ---------------------------------------------------------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0b1028";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const baseX = 30, baseY = 30, w = 1100, h = 100;
  roundRect(ctx, baseX, baseY, w, h, 14, "#0c1340", "#26357a");
  text("Gantt Chart", baseX + 12, baseY + 22, 14, "#9fb0ff");

  if (!state) return;

  const maxT = Math.max((state.clock ?? 0) + 1, totalBurst() + maxArrival());
  const chartX = baseX + 12, chartY = baseY + 36, chartW = w - 24, chartH = 70;

  ctx.strokeStyle = "#19234f";
  for (let t = 0; t <= maxT; t += 1) {
    const x = chartX + (t / maxT) * chartW;
    ctx.beginPath();
    ctx.moveTo(x, chartY);
    ctx.lineTo(x, chartY + chartH);
    ctx.stroke();
  }

  state.blocks.forEach((b) => {
    const p = state.processes.find((pp) => pp.pid === b.pid);
    const x1 = chartX + (b.start / maxT) * chartW;
    const x2 = chartX + (b.end / maxT) * chartW;
    roundRect(ctx, x1, chartY + 6, Math.max(2, x2 - x1), chartH - 12, 8, shade(p.color, 0.18), p.color);
    text(p.pid, x1 + 6, chartY + chartH / 2 + 4, 12, "#0b1020");
  });

  text(`Clock: ${state.clock}`, chartX, chartY + chartH + 16, 13, "#9fb0ff");
}

function totalBurst() {
  return state.processes.reduce((s, p) => s + p.burst, 0);
}
function maxArrival() {
  return Math.max(...state.processes.map((p) => p.arrival));
}

// ---------------------------------------------------------------
// UI + EVENT HANDLERS
// ---------------------------------------------------------------
const tableBody = document.querySelector("tbody");

function addRow(pid, arrival, burst, priority) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${pid}</td>
    <td contenteditable="true">${arrival}</td>
    <td contenteditable="true">${burst}</td>
    <td contenteditable="true">${priority}</td>
  `;
  tableBody.appendChild(tr);
}

byId("btnAdd").addEventListener("click", () => {
  const n = tableBody.querySelectorAll("tr").length;
  addRow(`P${n + 1}`, n * 2, 5, 1);
});
byId("btnClear").addEventListener("click", () => (tableBody.innerHTML = ""));
byId("btnBuild").addEventListener("click", () => initEngine());
byId("btnPlay").addEventListener("click", () => {
  if (!state) return;
  playing = true;
  playLoop();
});
byId("btnPause").addEventListener("click", () => {
  playing = false;
  cancelAnimationFrame(rafId);
});
byId("btnStep").addEventListener("click", () => {
  playing = false;
  if (!state) return;
  stepTick(state);
  draw();
  updateStats();
});
byId("btnStepBack").addEventListener("click", () => {
  playing = false;
  stepBack();
});
byId("btnReset").addEventListener("click", () => {
  playing = false;
  initEngine();
});
byId("btnExportPNG").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "rr_screenshot.png";
  a.click();
});
byId("btnExportCSV").addEventListener("click", () => {
  const rows = ["time,event,pid"];
  state.trace.forEach((t) => rows.push(`${t.time},${t.event},${t.pid ?? ""}`));
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rr_trace.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// ---------------------------------------------------------------
// STATS + LOGGING
// ---------------------------------------------------------------
function computeStats(s) {
  const completed = s.blocks.reduce((acc, b) => {
    const p = s.processes.find((x) => x.pid === b.pid);
    if (!acc[p.pid]) acc[p.pid] = { start: b.start, end: b.end, burst: p.burst };
    else acc[p.pid].end = b.end;
    return acc;
  }, {});
  const count = Object.keys(completed).length;
  if (count === 0) return { awt: 0, atat: 0, throughput: 0, cpuUtil: 0 };
  let totalWT = 0, totalTAT = 0, totalBurst = 0;
  for (const pid in completed) {
    const c = completed[pid];
    totalTAT += c.end - s.processes.find((p) => p.pid === pid).arrival;
    totalWT += totalTAT - c.burst;
    totalBurst += c.burst;
  }
  return {
    awt: totalWT / count,
    atat: totalTAT / count,
    throughput: count / s.clock,
    cpuUtil: (totalBurst / s.clock) * 100,
  };
}

function updateStats() {
  const s = computeStats(state);
  byId("statAWT").textContent = s.awt.toFixed(2);
  byId("statATAT").textContent = s.atat.toFixed(2);
  byId("statTH").textContent = s.throughput.toFixed(2) + "/t";
  byId("statCPU").textContent = s.cpuUtil.toFixed(1) + "%";
}

function logMsg(msg) {
  const box = byId("log");
  box.textContent += `t=${state.clock}: ${msg}\n`;
  box.scrollTop = box.scrollHeight;
}
function logClear() {
  byId("log").textContent = "";
}

// ---------------------------------------------------------------
// DRAW HELPERS
// ---------------------------------------------------------------
function roundRect(c, x, y, w, h, r, fill, stroke) {
  c.fillStyle = fill;
  c.strokeStyle = stroke;
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
  const c = parseInt(hex.slice(1), 16),
    r = (c >> 16) & 255,
    g = (c >> 8) & 255,
    b = c & 255;
  const fn = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `rgb(${fn(r)},${fn(g)},${fn(b)})`;
}
function randColor() {
  const colors = ["#4fc3f7", "#81c784", "#ba68c8", "#ffb74d", "#e57373"];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ---------------------------------------------------------------
// INITIAL SETUP
// ---------------------------------------------------------------
addRow("P1", 0, 5, 1);
addRow("P2", 2, 5, 1);
addRow("P3", 4, 5, 1);
