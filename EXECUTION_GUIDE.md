#  Execution Guide — Round Robin CPU Scheduling Visualizer

This guide explains how to **run, interact, and understand** the visualization locally on your system.

---

##  Step 1: Setup Instructions

1. **Ensure you have Python installed**  
   - Windows users: check by running  
     ```
     python --version
     ```
   - If not installed, download from [python.org](https://www.python.org/downloads/)

2. **Download or clone the repository**
   https://github.com/sujalgm/rr-visualizer.git
   *(or manually place the project folder anywhere on your system)*

3. **Open Command Prompt / Terminal** inside the project directory:
      cd rr-visualizer
   
4. **Start a local HTTP server** (required for module imports):
      python -m http.server 8000
   
5. **Open your browser** and visit:
      http://localhost:8000


---

##  Step 2: User Interface Guide

### Process Table
- **Add Process:** Click `+ Add Process` to add a new row.  
- **Edit Cells:** Directly edit *Arrival*, *Burst*, and *Priority* values.  
- **Clear Table:** Removes all current processes.  

### Simulation Controls
| Button | Function |
|---------|-----------|
| ▶ **Play** | Starts continuous animation of process execution |
| ⏸ **Pause** | Halts execution at the current state |
| ⏭ **Step** | Advances one CPU tick manually |
| ↺ **Reset** | Restores the simulation to the initial state |
| 📷 **Export Screenshot** | Saves a PNG image of the visualization |
| ⬇ **Export Trace** | Exports event logs (start, finish, preempt) as CSV |

---

##  Step 3: Animation & Visualization

- The **Gantt Chart** displays the execution timeline.  
- The **CPU block** highlights which process is currently executing.  
- The **Ready Queue** dynamically updates as processes arrive or get preempted.  
- Smooth frame-by-frame transitions ensure clarity.

---

##  Step 4: Statistics Display

After or during execution, the following real-time metrics are displayed:
| Metric | Meaning |
|---------|----------|
| **Avg Waiting Time (AWT)** | Average idle waiting time of processes |
| **Avg Turnaround Time (ATAT)** | Total time taken for each process completion |
| **Throughput** | Processes completed per unit time |
| **CPU Utilization** | Active CPU time as a percentage |

---

## Step 5: Browser Compatibility
This project works **offline** and is compatible with:
- Google Chrome 80+
- Microsoft Edge 85+
- Mozilla Firefox 79+
- Safari 13+

---

##  Educational Purpose
This visualizer was developed as part of an **Operating Systems assignment** to demonstrate CPU scheduling algorithms interactively.

---

##  Author
Sujal G M   
B.Tech — Computer Science and Engineering (IoT)  
VIT Vellore


