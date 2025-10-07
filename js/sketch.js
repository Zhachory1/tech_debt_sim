/**
 * Main p5.js sketch for the Tech Debt Simulation
 */

let simulation;
let canvas;

// UI elements
let startBtn, pauseBtn, resetBtn, addDevBtn, addProjectBtn, addTechDebtBtn;

function setup() {
    // Create canvas and attach to container
    const container = document.getElementById('canvas-container');
    canvas = createCanvas(1200, 600);
    canvas.parent(container);

    // Initialize simulation
    simulation = new Simulation();

    // Set up event listeners
    setupSimulationEvents();
    setupUIControls();

    // Initial UI update
    updateUI();
}

function draw() {
    background(240);

    if (simulation) {
        drawSimulation();
    }
}

function drawSimulation() {
    const metrics = simulation.getCurrentMetrics();

    // Draw main visualization areas
    drawProductMetrics(metrics.product, 50, 50, 300, 200);
    drawCodebaseStatus(metrics.codebase, 370, 50, 300, 200);
    drawTeamStatus(metrics.team, 690, 50, 300, 200);

    // Draw project flows
    drawProjectFlow(200, 300, 800, 250);

    // Draw simulation info
    drawSimulationInfo(50, 550);
}

function drawProductMetrics(product, x, y, w, h) {
    // Background
    fill(255);
    stroke(200);
    rect(x, y, w, h);

    // Title
    fill(0);
    textAlign(CENTER, TOP);
    textSize(16);
    textStyle(BOLD);
    text('Product Health', x + w / 2, y + 10);

    // Reputation meter
    const repY = y + 40;
    drawMeter('Reputation', product.reputation, -100, 100, x + 20, repY, w - 40, 20,
        color(220, 50, 50), color(50, 220, 50));

    // User count (as a growing bar)
    const userY = repY + 40;
    fill(70, 130, 255);
    const userWidth = map(Math.log(product.userCount), Math.log(100), Math.log(10000), 0, w - 40);
    rect(x + 20, userY, userWidth, 20);

    fill(0);
    textAlign(LEFT, TOP);
    textSize(12);
    text(`Users: ${product.userCount.toLocaleString()}`, x + 20, userY + 25);

    // Revenue
    const revY = userY + 50;
    text(`Revenue: $${Math.round(product.revenue).toLocaleString()}`, x + 20, revY);
    text(`Per User: $${Math.round(product.revenue / Math.max(1, product.userCount))}`, x + 20, revY + 20);
}

function drawCodebaseStatus(codebase, x, y, w, h) {
    // Background
    fill(255);
    stroke(200);
    rect(x, y, w, h);

    // Title
    fill(0);
    textAlign(CENTER, TOP);
    textSize(16);
    textStyle(BOLD);
    text('Codebase Health', x + w / 2, y + 10);

    // Code quality meter
    const qualityY = y + 40;
    drawMeter('Code Quality', codebase.codeQuality, 0, 100, x + 20, qualityY, w - 40, 20,
        color(220, 50, 50), color(50, 220, 50));

    // Failure probability
    const debtY = qualityY + 40;
    fill(0);
    textAlign(LEFT, TOP);
    textSize(16);
    text(`Failure Risk: ${codebase.failureProbability.toFixed(1)}%`, x + 20, debtY + 35);
    text(`Recent Features: ${codebase.recentFeaturesCount}`, x + 20, debtY + 55);
}

function drawTeamStatus(team, x, y, w, h) {
    // Background
    fill(255);
    stroke(200);
    rect(x, y, w, h);

    // Title
    fill(0);
    textAlign(CENTER, TOP);
    textSize(16);
    textStyle(BOLD);
    text('Engineering Team', x + w / 2, y + 10);

    // Team satisfaction meter
    const satY = y + 40;
    drawMeter('Avg Satisfaction', team.averageSatisfaction, 0, 100, x + 20, satY, w - 40, 20,
        color(220, 50, 50), color(50, 220, 50));

    // Developer count and info
    fill(0);
    textAlign(LEFT, TOP);
    textSize(12);
    text(`Developers: ${team.developerCount}`, x + 20, satY + 35);
    text(`Avg Skill: ${Math.round(team.averageSkill)}`, x + 20, satY + 55);
    text(`Workload: ${Math.round(team.averageWorkload * 100)}%`, x + 20, satY + 75);
}

function drawProjectFlow(x, y, w, h) {
    // Background
    fill(250);
    stroke(200);
    rect(x, y, w, h);

    // Title
    fill(0);
    textAlign(CENTER, TOP);
    textSize(16);
    textStyle(BOLD);
    text('Project Pipeline', x + w / 2, y + 10);

    const colWidth = w / 3;
    const team = simulation.engineeringTeam;

    // Ideas column
    drawProjectColumn('Ideas', team.ideaQueue, x + 20, y + 40, colWidth - 40, h - 60, color(200, 200, 255));

    // Todo column  
    drawProjectColumn('Todo', team.todoList, x + colWidth + 20, y + 40, colWidth - 40, h - 60, color(255, 200, 100));

    // In Progress column
    const inProgress = simulation.engineeringTeam.developers
        .filter(dev => dev.currentProject)
        .map(dev => dev.currentProject);
    drawProjectColumn('In Progress', inProgress, x + 2 * colWidth + 20, y + 40, colWidth - 40, h - 60, color(100, 255, 150));
}

function drawProjectColumn(title, projects, x, y, w, h, bgColor) {
    // Column background
    fill(bgColor);
    stroke(150);
    rect(x, y, w, h);

    // Title
    fill(0);
    textAlign(CENTER, TOP);
    textSize(14);
    textStyle(BOLD);
    text(title, x + w / 2, y + 5);
    text(`(${projects.length})`, x + w / 2, y + 20);

    // Project items
    textAlign(LEFT, TOP);
    textSize(10);
    textStyle(NORMAL);

    const maxVisible = Math.floor((h - 50) / 25);
    const visibleProjects = projects.slice(0, maxVisible);

    visibleProjects.forEach((project, index) => {
        const itemY = y + 40 + (index * 25);

        // Project type indicator
        if (project.type === PROJECT_TYPE.FEATURE) {
            fill(50, 150, 255);
        } else {
            fill(255, 100, 50);
        }
        rect(x + 5, itemY, 10, 15);

        // Project name and details
        fill(0);
        text(project.name, x + 20, itemY);
        text(`Impact: ${Math.round(project.impactValue)}`, x + 20, itemY + 12);

        // Progress bar for in-progress projects
        if (project.status === 'in_progress') {
            const progressWidth = (w - 30) * (project.progress / 100);
            fill(100, 255, 100);
            rect(x + 20, itemY + 20, progressWidth, 3);
            fill(200);
            rect(x + 20 + progressWidth, itemY + 20, (w - 30) - progressWidth, 3);
        }
    });

    // Show "..." if more projects exist
    if (projects.length > maxVisible) {
        fill(100);
        text(`... +${projects.length - maxVisible} more`, x + 20, y + 40 + (maxVisible * 25));
    }
}

function drawMeter(label, value, minVal, maxVal, x, y, w, h, colorFrom, colorTo) {
    // Background
    fill(230);
    stroke(150);
    rect(x, y, w, h);

    // Fill based on value
    const normalizedValue = (value - minVal) / (maxVal - minVal);
    const fillWidth = w * Math.max(0, Math.min(1, normalizedValue));

    // Color interpolation
    const r = lerp(red(colorFrom), red(colorTo), normalizedValue);
    const g = lerp(green(colorFrom), green(colorTo), normalizedValue);
    const b = lerp(blue(colorFrom), blue(colorTo), normalizedValue);

    fill(r, g, b);
    noStroke();
    rect(x, y, fillWidth, h);

    // Label and value
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(11);
    text(`${label}: ${Math.round(value * 10) / 10}`, x + w / 2, y + h / 2);
}

function drawSimulationInfo(x, y) {
    fill(0);
    textAlign(LEFT, TOP);
    textSize(12);
    text(`Step: ${simulation.step}`, x, y);
    text(`Status: ${simulation.isRunning ? (simulation.isPaused ? 'Paused' : 'Running') : 'Stopped'}`, x + 100, y);
}

function setupSimulationEvents() {
    simulation.addEventListener('stepCompleted', (data) => {
        updateUI();
    });

    simulation.addEventListener('simulationStarted', () => {
        startBtn.disabled = true;
        pauseBtn.disabled = false;
    });

    simulation.addEventListener('simulationPaused', () => {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    });

    simulation.addEventListener('simulationStopped', () => {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    });

    simulation.addEventListener('simulationReset', () => {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        updateUI();
    });
}

function setupUIControls() {
    startBtn = document.getElementById('startBtn');
    pauseBtn = document.getElementById('pauseBtn');
    resetBtn = document.getElementById('resetBtn');
    addDevBtn = document.getElementById('addDevBtn');
    addProjectBtn = document.getElementById('addProjectBtn');
    addTechDebtBtn = document.getElementById('addTechDebtBtn');

    startBtn.addEventListener('click', () => {
        if (simulation.isPaused) {
            simulation.resume();
        } else {
            simulation.start();
        }
    });

    pauseBtn.addEventListener('click', () => {
        simulation.pause();
    });

    resetBtn.addEventListener('click', () => {
        simulation.reset();
    });

    addDevBtn.addEventListener('click', () => {
        simulation.addDeveloper();
        updateUI();
    });

    addProjectBtn.addEventListener('click', () => {
        simulation.addFeatureProject();
        updateUI();
    });

    addTechDebtBtn.addEventListener('click', () => {
        simulation.addTechDebtProject();
        updateUI();
    });
}

function updateUI() {
    if (!simulation) return;

    const metrics = simulation.getCurrentMetrics();

    // Update stat cards
    document.getElementById('reputation').textContent = Math.round(metrics.product.reputation * 10) / 10;
    document.getElementById('userCount').textContent = metrics.product.userCount.toLocaleString();
    document.getElementById('revenue').textContent = `$${Math.round(metrics.product.revenue).toLocaleString()}`;
    document.getElementById('codeQuality').textContent = Math.round(metrics.codebase.codeQuality);
    document.getElementById('developerCount').textContent = metrics.team.developerCount;
    document.getElementById('ideaQueue').textContent = metrics.team.ideaQueueLength;
    document.getElementById('todoList').textContent = metrics.team.todoListLength;
}