/**
 * Main p5.js sketch for the Tech Debt Simulation
 */

let simulation;
let canvas;
let chartCanvas;

// UI elements
let startBtn, pauseBtn, resetBtn, addDevBtn, addProjectBtn, addTechDebtBtn;

function setup() {
    // Create main canvas and attach to container
    const container = document.getElementById('canvas-container');
    canvas = createCanvas(1200, 600);
    canvas.parent(container);
    
    // Create chart canvas and attach to chart container
    const chartContainer = document.getElementById('chart-canvas');
    chartCanvas = createGraphics(400, 200);

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
        drawChart();
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

function drawChart() {
    if (!simulation || !simulation.stats || !simulation.stats.history) return;
    
    // Clear the chart canvas
    chartCanvas.background(255);
    
    const history = simulation.stats.history;
    if (history.length < 2) return;
    
    const chartWidth = 380;
    const chartHeight = 160;
    const margin = 10;
    const plotWidth = chartWidth - 2 * margin;
    const plotHeight = chartHeight - 2 * margin;
    
    // Get data ranges for scaling
    const maxUsers = Math.max(...history.map(h => h.product.userCount));
    const minUsers = Math.min(...history.map(h => h.product.userCount));
    const maxRevenue = Math.max(...history.map(h => h.product.revenue));
    const minRevenue = Math.min(...history.map(h => h.product.revenue));
    
    // Draw background grid
    chartCanvas.stroke(240);
    chartCanvas.strokeWeight(1);
    for (let i = 0; i <= 5; i++) {
        const y = margin + (i * plotHeight / 5);
        chartCanvas.line(margin, y, margin + plotWidth, y);
    }
    for (let i = 0; i <= 10; i++) {
        const x = margin + (i * plotWidth / 10);
        chartCanvas.line(x, margin, x, margin + plotHeight);
    }
    
    // Draw user count line (blue)
    chartCanvas.stroke(70, 130, 255);
    chartCanvas.strokeWeight(2);
    chartCanvas.noFill();
    chartCanvas.beginShape();
    for (let i = 0; i < history.length; i++) {
        const x = margin + (i / (history.length - 1)) * plotWidth;
        const userRatio = maxUsers > minUsers ? (history[i].product.userCount - minUsers) / (maxUsers - minUsers) : 0.5;
        const y = margin + plotHeight - (userRatio * plotHeight);
        chartCanvas.vertex(x, y);
    }
    chartCanvas.endShape();
    
    // Draw revenue line (orange)
    chartCanvas.stroke(255, 165, 0);
    chartCanvas.strokeWeight(2);
    chartCanvas.noFill();
    chartCanvas.beginShape();
    for (let i = 0; i < history.length; i++) {
        const x = margin + (i / (history.length - 1)) * plotWidth;
        const revenueRatio = maxRevenue > minRevenue ? (history[i].product.revenue - minRevenue) / (maxRevenue - minRevenue) : 0.5;
        const y = margin + plotHeight - (revenueRatio * plotHeight);
        chartCanvas.vertex(x, y);
    }
    chartCanvas.endShape();
    
    // Draw legend
    chartCanvas.fill(70, 130, 255);
    chartCanvas.noStroke();
    chartCanvas.rect(margin + 10, margin + 5, 10, 2);
    chartCanvas.fill(0);
    chartCanvas.textAlign(LEFT, TOP);
    chartCanvas.textSize(10);
    chartCanvas.text('Users', margin + 25, margin + 2);
    
    chartCanvas.fill(255, 165, 0);
    chartCanvas.noStroke();
    chartCanvas.rect(margin + 70, margin + 5, 10, 2);
    chartCanvas.fill(0);
    chartCanvas.text('Revenue', margin + 85, margin + 2);
    
    // Draw current values
    if (history.length > 0) {
        const latest = history[history.length - 1];
        chartCanvas.fill(0);
        chartCanvas.textAlign(RIGHT, TOP);
        chartCanvas.textSize(9);
        chartCanvas.text(`Users: ${latest.product.userCount.toLocaleString()}`, chartWidth - margin, margin + 15);
        chartCanvas.text(`Revenue: $${Math.round(latest.product.revenue).toLocaleString()}`, chartWidth - margin, margin + 28);
    }
    
    // Display the chart on the webpage
    const chartContainer = document.getElementById('chart-canvas');
    if (chartContainer) {
        // Remove existing canvas if any
        const existingCanvas = chartContainer.querySelector('canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        
        // Add the new chart canvas
        const canvasElement = chartCanvas.canvas;
        canvasElement.style.display = 'block';
        canvasElement.style.margin = '0 auto';
        chartContainer.appendChild(canvasElement);
    }
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
}