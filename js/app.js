// ==========================
// Round Robin Visualizer App
// Handles UI, animation loop, drawing, and event logic
// ==========================

// --- Utility: Short helper to access DOM elements
function byId(id) {
  return document.getElementById(id);
}

// --- Canvas and global state references
const canvas = byId("stage");
const ctx = canvas.getContext("2d");
let playing = false;
let rafId = null;
let state = null; // simulation state object

// --- Table body reference (process list)
const tableBody = document.querySelector("table tbody");

// ==========================
// State Management & Engine Init
// ==========================
function initEngine() {
  const rows = tableBody.querySelectorAll("tr");
  const processes = [];

  rows.forEach(row => {
    const pid = row.cells[0].textContent.trim();
    const arrival = parseInt(row.cells[1].textContent.trim());
    const burst = parseInt(row.cells[2].textContent.trim());
    const priority = parseInt(row.cells[3].textContent.trim());
    processes.push({ pid, arrival, burst, remaining: burst, priority });
  });

  const tq = parseInt(byId("tq").value) || 3;
  state = {
    clock: 0,
    tq,
    processes,
    readyQ: [],
    running: null,
    blocks: [],
    trace: []
  };

  draw();
  updateStats();
  logMsg("Initialized Round Robin Engine");
}

// ==========================
// Step Logic (CPU Tick)
// ==========================
function stepTick(state) {
  // Advance time
  state.clock++;

  // Move newly arrived processes to ready queue
  state.processes.forEach(p => {
    if (p.arrival === state.clock) {
      state.readyQ.push(p);
      logMsg(`Process ${p.pid} arrived`);
    }
  });

  // If no running process, pick one from queue
  if (!state.running && state.readyQ.length > 0) {
    state.running = state.readyQ.shift();
    state.running.startTime = state.clock;
    state.running.quantumLeft = state.tq;
    logMsg(`Process ${state.running.pid} started running`);
  }

  // Execute running process
  if (state.running) {
    state.running.remaining--;
    state.running.quantumLeft--;

    if (state.running.remaining <= 0) {
      logMsg(`✅ Process ${state.running.pid} completed`);
      state.blocks.push({
        pid: state.running.pid,
        start: state.running.startTime,
        end: state.clock
      });
      state.running = null;
    } else if (state.running.quantumLeft <= 0) {
      // Time quantum expired — preempt
      logMsg(`🔁 Process ${state.running.pid} preempted`);
      state.readyQ.push(state.running);
      state.running = null;
    }
  }

  // Stop condition when all processes done
  if (state.processes.every(p => p.remaining <= 0)) {
    playing = false;
    cancelAnimationFrame(rafId);
    logMsg("🎉 Simulation complete.");
  }
}

// ==========================
// Animation Loop
// ==========================
function playLoop() {
  if (!state || !playing) return;

  stepTick(state);
  draw();
  updateStats();

  // Continue only if simulation is running
  if (playing) {
    rafId = requestAnimationFrame(playLoop);
  }
}

// ==========================
// Drawing and Visualization
// ==========================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGantt();
}

function drawGantt() {
  const baseX = 340, baseY = 30, w = 830, h = 120;
  roundRect(ctx, baseX, baseY, w, h, 14, "#0c1340", "#26357a");
  text("Gantt Chart", baseX + 12, baseY + 22, 14, "#9fb0ff");

  if (!state) return;

  const maxT = Math.max(state.clock + 1, totalBurst() + maxArrival());
  const chartX = baseX + 12, chartY = baseY + 36, chartW = w - 24, chartH = 70;
  ctx.strokeStyle = "#19234f";
  ctx.lineWidth = 1;
  for (let t = 0; t <= maxT; t += 1) {
    const x = chartX + (t / maxT) * chartW;
    ctx.beginPath();
    ctx.moveTo(x, chartY);
    ctx.lineTo(x, chartY + chartH);
    ctx.stroke();
  }

  if (!state.blocks) return;
  state.blocks.forEach(b => {
    const p = state.processes.find(pp => pp.pid === b.pid);
    const x1 = chartX + (b.start / maxT) * chartW;
    const x2 = chartX + (b.end / maxT) * chartW;
    roundRect(ctx, x1, chartY + 6, Math.max(2, x2 - x1), chartH - 12, 8, shade(p.color || "#4a7cff", 0.18), p.color || "#4a7cff");
    text(p.pid, x1 + 6, chartY + chartH / 2 + 4, 12, "#0b1020");
  });

  text(`Clock: ${state.clock}`, baseX + 10, baseY + h + 30, 14, "#9fb0ff");
}

// ==========================
// Stats, Logging, Helpers
// ==========================
function totalBurst() {
  return state.processes.reduce((s, p) => s + p.burst, 0);
}

function maxArrival() {
  return Math.max(...state.processes.map(p => p.arrival));
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

// --- Reusable Drawing Helpers
function roundRect(c, x, y, w, h, r, fill, stroke) {
  c.fillStyle = fill;
  c.strokeStyle = stroke;
  c.lineWidth = 1;
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
  const fn = v => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `rgb(${fn(r)},${fn(g)},${fn(b)})`;
}

// ==========================
// Button Event Bindings
// ==========================
byId("btnAdd").addEventListener("click", () => {
  const n = tableBody.querySelectorAll("tr").length;
  addRow(`P${n + 1}`, n * 1, 5, 1);
});

byId("btnClear").addEventListener("click", () => {
  tableBody.innerHTML = "";
});

byId("btnBuild").addEventListener("click", () => {
  initEngine();
});

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
  state.trace.forEach(t => rows.push(`${t.time},${t.event},${t.pid ?? ""}`));
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rr_trace.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// --- Default processes for demo
addRow("P1", 0, 5, 1);
addRow("P2", 2, 5, 1);
addRow("P3", 4, 5, 1);
