// ===============================
// app.js
// Handles UI, Canvas drawing, and animation control
// ===============================

import { buildInitialState, tickForward, computeStats } from './algorithms.js';

// Helper: short alias for document.getElementById
function byId(id) { return document.getElementById(id); }

// Canvas and main variables
const canvas = byId('stage');
const ctx = canvas.getContext('2d');
const tableBody = document.querySelector('#procTable tbody');
let state = null;
let playing = false;
let rafId;

// ===============================
// UI TABLE HANDLING
// ===============================

// Adds a process row to the table
function addRow(pid, arrival, burst, prio) {
  const row = document.createElement('tr');
  row.innerHTML = `<td>${pid}</td>
                   <td contenteditable>${arrival}</td>
                   <td contenteditable>${burst}</td>
                   <td contenteditable>${prio}</td>`;
  tableBody.appendChild(row);
}

// Reads all processes from table
function readProcesses() {
  return [...tableBody.querySelectorAll('tr')].map(tr => {
    const tds = tr.querySelectorAll('td');
    return {
      pid: tds[0].innerText,
      arrival: parseInt(tds[1].innerText) || 0,
      burst: parseInt(tds[2].innerText) || 1,
      priority: parseInt(tds[3].innerText) || 1
    };
  });
}

// Initialize or rebuild the scheduler engine
function initEngine() {
  const quantum = parseInt(byId('quantum').value) || 4;
  const processes = readProcesses();
  state = buildInitialState(processes, quantum);
  draw();
}

// ===============================
// SIMULATION & DRAWING
// ===============================

// Main animation loop
function playLoop() {
  if (!state || !playing) return;
  tickForward(state);
  draw();
  rafId = requestAnimationFrame(playLoop);
}

// Draw current state to canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // CPU area background
  ctx.fillStyle = '#19234f';
  ctx.fillRect(20, 60, 1160, 80);

  // Clock display
  ctx.fillStyle = '#9fb0ff';
  ctx.font = '16px Segoe UI';
  ctx.fillText(`Clock: ${state.clock}`, 40, 40);
}

// ===============================
// BUTTON EVENT LISTENERS
// ===============================

byId('btnAdd').addEventListener('click', () => {
  const n = tableBody.querySelectorAll('tr').length;
  addRow(`P${n + 1}`, n * 2, 5, 1);
});

byId('btnClear').addEventListener('click', () => tableBody.innerHTML = '');
byId('btnBuild').addEventListener('click', initEngine);

byId('btnPlay').addEventListener('click', () => {
  playing = true;
  playLoop();
});

byId('btnPause').addEventListener('click', () => {
  playing = false;
  cancelAnimationFrame(rafId);
});

byId('btnReset').addEventListener('click', () => {
  playing = false;
  initEngine();
});

// Add default demo processes
addRow('P1', 0, 5, 1);
addRow('P2', 1, 3, 1);
addRow('P3', 2, 6, 1);
