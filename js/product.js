/**
 * Product class - represents the main product with reputation, users, and revenue
 */
class Product {
    constructor(initialUserCount = 1000, constants = null) {
        this.reputation = 0; // Can be negative or positive
        this.userCount = initialUserCount;
        this.revenue = 0;
        this.codebase = null; // Will be injected
        if (constants != null && constants instanceof Constants) {
            this.setConstants(constants);
        }
    }

    setConstants(constants) {
        if (constants instanceof Constants) {
            this.constants = constants;
        }
        this.constants.set("reputationThreshold", 50);
        this.constants.set("reputationDecay", 0.02);
        this.constants.set("userGrowthRate", 0.1);
        this.constants.set("revenuePerUser", 10);
        this.constants.set("churnRate", 0.002);
        this.constants.set("marketGrowthRate", 0.001);
    }
    
    setCodebase(codebase) {
        this.codebase = codebase;
    }
    
    moneyModel(userCount) {
        // Revenue model based on user count
        // Includes base revenue per user plus scaling bonuses
        const baseRevenue = userCount * this.constants.get("revenuePerUser", 10);
        
        // Economies of scale - more users = better revenue per user
        const scalingBonus = Math.log(userCount / 1000 + 1) * userCount * 2;
        
        // Reputation affects revenue efficiency
        const reputationMultiplier = Math.max(0.5, 1 + (this.reputation / 200));
        
        return Math.max(0, (baseRevenue + scalingBonus) * reputationMultiplier);
    }
    
    updateReputation() {
        let reputationChange = 0;
        
        // Get reputation impact from features (handled by codebase)
        if (this.codebase) {
            const featureImpact = this.codebase.getReputationImpactFromFeatures();
            reputationChange += featureImpact;
            
            // Check for failures that hurt reputation
            const failure = this.codebase.checkForFailure();
            if (failure) {
                reputationChange -= failure.impact;
                console.log(`Product failure: ${failure.description} (Impact: -${failure.impact})`);
            }
        }
        
        // Apply reputation change
        this.reputation += reputationChange;
        
        // Natural reputation decay toward 0
        if (this.reputation > 0) {
            this.reputation -= this.constants.get("reputationDecay", 0.02);
        } else if (this.reputation < 0) {
            this.reputation += this.constants.get("reputationDecay", 0.02);
        }
        
        // Clamp reputation to reasonable bounds
        this.reputation = Math.max(-100, Math.min(100, this.reputation));
        
        return reputationChange;
    }
    
    updateUserCount() {
        let userChange = 0;
        
        // Reputation affects user count
        if (this.reputation > this.constants.get("reputationThreshold", 50)) {
            // Good reputation increases users
            const growth = (this.reputation - this.constants.get("reputationThreshold", 50)) * this.constants.get("userGrowthRate", 0.1);
            userChange += growth;
        } else if (this.reputation < -this.constants.get("reputationThreshold", 50)) {
            // Bad reputation decreases users
            const decline = (this.reputation + this.constants.get("reputationThreshold", 50)) * this.constants.get("userGrowthRate", 0.1);
            userChange += decline; // This will be negative
        }
        
        // Natural user churn
        const churn = this.userCount * this.constants.get("churnRate", 0.002);
        userChange -= churn;
        
        // Market growth (small positive baseline)
        const marketGrowth = this.userCount * this.constants.get("marketGrowthRate", 0.001);
        userChange += marketGrowth;
        
        // Apply user change
        this.userCount = Math.max(0, this.userCount + userChange);
        
        return userChange;
    }
    
    updateRevenue() {
        this.revenue = this.moneyModel(this.userCount);
        return this.revenue;
    }
    
    processCompletedProjects(completedProjects) {
        if (!this.codebase) return;
        
        completedProjects.forEach(project => {
            if (project.type === 'feature') {
                this.codebase.addFeatureLaunch(project);
            } else if (project.type === 'tech_debt') {
                this.codebase.processTechDebtReduction(project);
            }
        });
    }
    
    step() {
        // Update all product metrics
        const reputationChange = this.updateReputation();
        const userChange = this.updateUserCount();
        const revenue = this.updateRevenue();
        
        return {
            reputationChange,
            userChange,
            revenue,
            reputation: this.reputation,
            userCount: this.userCount
        };
    }
    
    getMetrics() {
        return {
            reputation: Math.round(this.reputation * 100) / 100,
            userCount: Math.round(this.userCount),
            revenue: Math.round(this.revenue),
            reputationThreshold: this.reputationThreshold,
            churnRate: Math.round(this.churnRate * 10000) / 100 // As percentage
        };
    }
    
    // Utility methods for analysis
    getUserGrowthRate() {
        if (this.reputation > this.reputationThreshold) {
            return (this.reputation - this.reputationThreshold) * this.constants.get("userGrowthRate", 0.1);
        } else if (this.reputation < -this.reputationThreshold) {
            return (this.reputation + this.reputationThreshold) * this.constants.get("userGrowthRate", 0.1);
        }
        return 0;
    }
    
    getRevenuePerUser() {
        if (this.userCount === 0) return 0;
        return this.revenue / this.userCount;
    }
}