/**
 * Product class - represents the main product with reputation, users, and revenue
 */
class Product {
    constructor(initialUserCount = 1000, constants = null) {
        this.reputation = 0; // Can be negative or positive
        this.userCount = initialUserCount;
        this.revenue = 0;
        this.codebase = null; // Will be injected
        this.setConstants(constants);
    }

    setConstants(constants) {
        if (constants != null) {
            this.constants = constants;
        } else {
            this.constants = new Constants();
        }
        
        // Default constants for product management
        this.constants.set("reputationThreshold", 15);
        this.constants.set("reputationDecay", 0.1);
        // Max (or min) Rep would get us this rate of user increase.
        this.constants.set("maxUserGrowthRate", 0.05); // 5%
        this.constants.set("revenuePerUser", 10);
        this.constants.set("churnRate", 0.001); // 0.1%; takes in market growth and churn rate
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
            this.reputation -= this.constants.get("reputationDecay");
        } else if (this.reputation < 0) {
            this.reputation += this.constants.get("reputationDecay");
        }
        
        // Clamp reputation to reasonable bounds
        this.reputation = Math.max(-100, Math.min(100, this.reputation));
        
        return reputationChange;
    }
    
    updateUserCount() {
        let userChange = 0;
        
        // Reputation affects user count
        // I want this to be a multiplicative affect instead of an additive one
        const repGrowth = this.userCount * this.getUserGrowthRate()
        userChange += repGrowth
        
        // Natural user churn
        const churn = this.userCount * this.constants.get("churnRate");
        userChange -= churn;
        
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
            console.log(`Processing completed project: ${project.name} (Type: ${project.type}, Impact: ${project.impactValue})`);
            if (project.type === PROJECT_TYPE.FEATURE) {
                this.codebase.addFeatureLaunch(project);
            } else if (project.type === PROJECT_TYPE.TECH_DEBT) {
                this.codebase.processTechDebtReduction(project)
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
            reputationThreshold: this.constants.get("reputationThreshold"),
            churnRate: Math.round(this.churnRate * 100) / 100 // As percentage
        };
    }
    
    // Utility methods for analysis
    getUserGrowthRate() {
        const repThreshold = this.constants.get("reputationThreshold");
        const maxGrowthRate = this.constants.get("maxUserGrowthRate");
        const range = 100 - repThreshold;
        if (this.reputation > repThreshold) {
            return (this.reputation - repThreshold) / range * maxGrowthRate;
        } else if (this.reputation < -repThreshold) {
            return (this.reputation + repThreshold) / range * maxGrowthRate;
        }
        return 0;
    }
    
    getRevenuePerUser() {
        if (this.userCount === 0) return 0;
        return this.revenue / this.userCount;
    }
}