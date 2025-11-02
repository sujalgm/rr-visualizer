// ===============================
// algorithms.js
// Core logic for Round Robin Scheduling
// ===============================

// Initialize full simulation state
export function buildInitialState(processes, quantum) {
    return {
      clock: 0,              // global time counter
      quantum,               // time slice
      processes: processes.map(p => ({ ...p, remaining: p.burst })), // clone each process
      queue: [],             // ready queue
      finished: [],          // completed processes
      trace: [],             // event log
      blocks: []             // Gantt chart data
    };
  }
  
  // One time tick forward
  export function tickForward(state) {
    const { clock, processes, queue, quantum } = state;
  
    //  Add newly arrived processes to ready queue
    processes.filter(p => p.arrival === clock).forEach(p => queue.push(p));
  
    //  Pick process if none running
    if (!state.running && queue.length > 0) {
      state.running = queue.shift();
      state.slice = 0;
      state.trace.push({ time: clock, event: 'start', pid: state.running.pid });
    }
  
    //  Execute running process
    if (state.running) {
      state.running.remaining--;
      state.slice++;
  
      //  Case: process finished
      if (state.running.remaining === 0) {
        state.trace.push({ time: clock + 1, event: 'finish', pid: state.running.pid });
        state.running.finish = clock + 1;
        state.finished.push(state.running);
        state.running = null;
      }
  
      //  Case: quantum expired
      else if (state.slice === quantum) {
        queue.push(state.running);
        state.trace.push({ time: clock + 1, event: 'preempt', pid: state.running.pid });
        state.running = null;
      }
    }
  
    //  Advance time
    state.clock++;
    return state;
  }
  
  // Compute performance metrics
  export function computeStats(state) {
    const n = state.finished.length;
    if (n === 0) return { awt: 0, atat: 0, throughput: 0, cpuUtil: 0 };
  
    const awt = state.finished.reduce((s, p) => s + (p.finish - p.arrival - p.burst), 0) / n;
    const atat = state.finished.reduce((s, p) => s + (p.finish - p.arrival), 0) / n;
    const throughput = n / state.clock;
    const cpuUtil = 100 * (1 - (state.idle || 0) / state.clock);
  
    return { awt, atat, throughput, cpuUtil };
  }
  