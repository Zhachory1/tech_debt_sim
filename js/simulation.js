/**
 * Simulation class - orchestrates the entire tech debt simulation
 */
class Simulation {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.step = 0;
        this.stepInterval = null;
        this.stepsPerSecond = 2;
        
        // Initialize all components
        this.constants = new Constants();
        this.product = new Product(1000, this.constants);
        this.codebase = new Codebase(50, this.constants);
        this.engineeringTeam = new EngineeringTeam(3, this.constants);
        this.leads = []; // You can add leads as needed
        
        // Connect dependencies
        this.product.setCodebase(this.codebase);
        
        // Event listeners
        this.eventListeners = [];
        
        // Statistics tracking
        this.stats = {
            history: [],
            maxHistoryLength: 250
        };
        
        // Add some initial projects
        this.initializeProjects();
    }
    
    initializeProjects() {
        // Add some initial feature projects
        this.engineeringTeam.addFeatureProject(15);
        this.engineeringTeam.addFeatureProject(12);
        this.engineeringTeam.addTechDebtProject(8);
        this.engineeringTeam.addFeatureProject(10);
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        
        this.stepInterval = setInterval(() => {
            if (!this.isPaused) {
                this.runStep();
            }
        }, 1000 / this.stepsPerSecond);
        
        this.emit('simulationStarted');
    }
    
    pause() {
        this.isPaused = true;
        this.emit('simulationPaused');
    }
    
    resume() {
        this.isPaused = false;
        this.emit('simulationResumed');
    }
    
    stop() {
        if (this.stepInterval) {
            clearInterval(this.stepInterval);
            this.stepInterval = null;
        }
        
        this.isRunning = false;
        this.isPaused = false;
        this.emit('simulationStopped');
    }
    
    reset() {
        this.stop();
        this.step = 0;
        
        // Reset all components
        this.product = new Product(1000, 50, this.constants);
        this.codebase = new Codebase(80, this.constants);
        this.engineeringTeam = new EngineeringTeam(3, this.constants);
        this.leads = [];
        
        // Reconnect dependencies
        this.product.setCodebase(this.codebase);
        
        // Clear statistics
        this.stats.history = [];
        
        // Reinitialize
        this.initializeProjects();
        
        this.emit('simulationReset');
    }
    
    runStep() {
        this.step++;
        
        // Step 1: Engineering team activities
        this.engineeringTeam.step();
        
        // Step 2: Work on projects
        const completedProjects = this.engineeringTeam.workOnProjects(this.codebase.codeQuality);
        
        // Step 3: Process completed projects
        this.product.processCompletedProjects(completedProjects);
        
        // Step 4: Update codebase
        this.codebase.step();
        
        // Step 5: Update product metrics
        const productMetrics = this.product.step();
        
        // Step 6: Update team satisfaction based on product performance
        const satisfactionFactors = {
            recentFailures: productMetrics.reputationChange < -5 ? 1 : 0,
            codebaseQuality: this.codebase.codeQuality
        };
        
        const leavingDevelopers = this.engineeringTeam.updateTeamSatisfaction(satisfactionFactors);
        
        // Step 7: Handle any leads (if implemented)
        this.leads.forEach(lead => lead.step());
        
        // Record statistics
        this.recordStatistics();
        
        // Emit step completed event
        this.emit('stepCompleted', {
            step: this.step,
            completedProjects,
            leavingDevelopers,
            productMetrics
        });
    }
    
    recordStatistics() {
        const currentStats = {
            step: this.step,
            product: this.product.getMetrics(),
            codebase: this.codebase.getMetrics(),
            team: this.engineeringTeam.getMetrics(),
            timestamp: Date.now()
        };
        
        this.stats.history.push(currentStats);
        
        // Limit history length
        if (this.stats.history.length > this.stats.maxHistoryLength) {
            this.stats.history.shift();
        }
    }
    
    // Public methods for external control
    addDeveloper(name, baseSkill, techDebtTolerance) {
        this.engineeringTeam.addDeveloper(name, baseSkill, techDebtTolerance);
    }
    
    addFeatureProject(impactValue) {
        return this.engineeringTeam.addFeatureProject(impactValue);
    }
    
    addTechDebtProject(impactValue) {
        return this.engineeringTeam.addTechDebtProject(impactValue);
    }
    
    addLead(lead) {
        if (lead instanceof Lead) {
            this.leads.push(lead);
            return true;
        }
        return false;
    }
    
    // Getters for current state
    getCurrentMetrics() {
        return {
            product: this.product.getMetrics(),
            codebase: this.codebase.getMetrics(),
            team: this.engineeringTeam.getMetrics(),
            step: this.step,
            isRunning: this.isRunning,
            isPaused: this.isPaused
        };
    }
    
    getStatistics() {
        return {
            current: this.getCurrentMetrics(),
            history: this.stats.history,
            summary: this.calculateSummaryStats()
        };
    }
    
    calculateSummaryStats() {
        if (this.stats.history.length === 0) return null;
        
        const history = this.stats.history;
        const recent = history.slice(-10); // Last 10 steps
        
        return {
            averageReputation: recent.reduce((sum, stat) => sum + stat.product.reputation, 0) / recent.length,
            userGrowthRate: recent.length > 1 ? 
                (recent[recent.length - 1].product.userCount - recent[0].product.userCount) / recent.length : 0,
            averageCodeQuality: recent.reduce((sum, stat) => sum + stat.codebase.codeQuality, 0) / recent.length,
            averageSatisfaction: recent.reduce((sum, stat) => sum + stat.team.averageSatisfaction, 0) / recent.length,
            totalRevenue: history.reduce((sum, stat) => sum + stat.product.revenue, 0)
        };
    }
    
    // Event system
    addEventListener(event, callback) {
        this.eventListeners.push({ event, callback });
    }
    
    removeEventListener(event, callback) {
        this.eventListeners = this.eventListeners.filter(
            listener => !(listener.event === event && listener.callback === callback)
        );
    }
    
    emit(event, data = null) {
        this.eventListeners
            .filter(listener => listener.event === event)
            .forEach(listener => listener.callback(data));
    }
    
    // Utility methods
    setStepsPerSecond(stepsPerSecond) {
        this.stepsPerSecond = Math.max(0.1, Math.min(10, stepsPerSecond));
        
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }
}