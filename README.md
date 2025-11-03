#  Round Robin CPU Scheduling — Interactive Visualizer

**Hosted on GitHub Pages:**
https://sujalgm.github.io/rr-visualizer/

### Overview
This project is a **browser-based simulation tool** that visualizes the **Round Robin CPU Scheduling Algorithm**.  
It allows users to add processes dynamically, set a custom time quantum, and view the **Gantt chart**, **ready queue**, and **statistics** such as:
- Average Waiting Time  
- Average Turnaround Time  
- CPU Utilization  
- Throughput  

Built using **HTML5**, **CSS3**, and **JavaScript (ES6 Modules)**, it provides an **interactive, educational, and visually intuitive** experience for understanding process scheduling in Operating Systems.

---

### Features
| Feature | Description |
|----------|-------------|
|  **Algorithm Simulation** | Implements Round Robin Scheduling with adjustable time quantum |
|  **Dynamic Process Input** | Add, edit, or remove processes directly from the table |
|  **Animation Controls** | Play, Pause, Step Forward, and Reset execution |
|  **Real-Time Statistics** | Displays live CPU and process performance metrics |
|  **Export Tools** | Export a screenshot of the Gantt chart and CSV trace log |
|  **Interactive UI** | Smooth visuals, responsive design, dark theme for readability |
|  **Modular Architecture** | Separate files for UI, animation logic, and algorithms |
|  **Offline Support** | Works entirely offline in any modern browser (Chrome, Firefox, Edge, Safari) |

---

###  File Structure
```
rr-visualizer/
│
├── index.html # Main interface layout
├── style.css # Styling and theme
│
└── js/
├── algorithms.js # Core Round Robin scheduling logic
└── app.js # UI, animation loop, and event handling
│
├── README.md # Project description and overview
└── EXECUTION_GUIDE.md # Setup and running instructions
```

---

### Technologies Used
- **HTML5** for structure  
- **CSS3** for styling and animations  
- **Vanilla JavaScript (ES6 Modules)** for interactivity and simulation logic  
- **Canvas API** for drawing Gantt chart and visual updates  

---

###  Algorithm Summary
The **Round Robin Scheduling** algorithm assigns a fixed time quantum for each process in a cyclic order:
1. All processes are placed in a ready queue.
2. Each process executes for a maximum of the time quantum.
3. If a process finishes early, it leaves the queue.
4. If not, it is preempted and moved to the queue's end.
5. This continues until all processes finish.

This ensures **fair CPU time distribution** among all processes.

---

### Credits
Developed by Sujal G M   
B.Tech — Computer Science and Engineering (IoT)  
VIT Vellore  

---

###  Notes
This visualizer is intended for **educational and academic use** to demonstrate how the Round Robin CPU scheduling algorithm functions over discrete time steps.


