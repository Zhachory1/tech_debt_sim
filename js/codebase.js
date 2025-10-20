/**
 * Codebase class - represents the technical foundation of the product
 */
class Codebase {
    constructor(initialQuality = 0, constants = null) {
        // Quality here is more of a doc health, tech debt level, and maintainability score
        // 0 = unmaintainable, 100 = pristine. Affects failure probability and maintenance cost.
        this.setConstants(constants);
        
        this.id = Math.random().toString(36).substr(2, 9);
        this.codeQuality = initialQuality; // 0-100 scale
        this.recentFeatureLaunches = []; // Array of features with launch dates
        this.failureProbability = this.calculateFailureProbability();
        this.maintenanceCost = 0;
        this.impactWindow = 1 * 60 * 1000; // 1 minute in milliseconds
    }
    
    setConstants(constants) {
        if (constants != null) {
            this.constants = constants;
        } else {
            this.constants = new Constants();
        }

        // Default constants for codebase management
        this.constants.set("maxFailureProbability", 0.01);
        this.constants.set("minFailureProbability", 0.0001);
        this.constants.set("featureLaunchImpactDecay", 0.8);
        this.constants.set("codeQualityDecayRate", 0.05);
        this.constants.set("featureImpactBase", 10);
        this.constants.set("techDebtReductionEfficiency", 1.0);
        this.constants.set("maintenanceCostFactor", 100); // Cost per point of quality degradation
        this.constants.set("maxSeverity", 10);
        this.constants.set("minSeverity", 2);
    }

    calculateFailureProbability() {
        // Lower code quality = higher failure probability
        const qualityFactor = (100 - this.codeQuality) / 100;
        const failureProbabilityRange = this.constants.get("maxFailureProbability") - this.constants.get("minFailureProbability");

        return Math.min(this.constants.get("maxFailureProbability"), 
            qualityFactor*failureProbabilityRange + this.constants.get("minFailureProbability"));
    }
    
    addFeatureLaunch(project) {
        if (project.type !== PROJECT_TYPE.FEATURE || project.hasAffectedReputation) {
            return;
        }
        console.log("Adding feature launch to codebase history:", project.name);
        
        const launch = {
            projectId: project.id,
            name: project.name,
            impactValue: project.impactValue,
            launchDate: Date.now(),
            hasImpactedReputation: false
        };
        
        this.recentFeatureLaunches.push(launch);
        
        // Add tech debt based on developer's tolerance and rush
        const developer = project.assignedDeveloper;
        if (developer) {
            const techDebtAdded = Math.max(0, (100 - developer.techDebtTolerance) / 10);
            this.degradeCodeQuality(techDebtAdded);
        }
        
        return launch;
    }
    
    getReputationImpactFromFeatures() {
        let totalImpact = 0;
        const currentTime = Date.now();
        
        // Clean up old features (older than impact window)
        this.recentFeatureLaunches = this.recentFeatureLaunches.filter(
            feature => (currentTime - feature.launchDate) < this.impactWindow
        );

        // Calculate diminishing returns for recent features
        this.recentFeatureLaunches.forEach((feature, index) => {
            if (!feature.hasImpactedReputation) {
                // Apply diminishing returns based on how many recent features there are
                const diminishingFactor = Math.pow(this.constants.get("featureLaunchImpactDecay"), index);
                const impact = feature.impactValue * diminishingFactor;
                totalImpact += impact;
                feature.hasImpactedReputation = true;
            }
        });
        if (totalImpact !== 0) {
            console.log(`Codebase reputation impact from features: ${totalImpact}`);
        }
        return totalImpact;
    }
    
    processTechDebtReduction(project) {
        if (project.type !== PROJECT_TYPE.TECH_DEBT) {
            console.log("Project is not tech debt.");
            return 0;
        }
        const reduction = project.impactValue;
        this.improveCodeQuality(reduction * this.constants.get("techDebtReductionEfficiency"));
        return reduction;
    }
    
    improveCodeQuality(amount) {
        this.codeQuality = Math.min(100, this.codeQuality + amount);
        this.failureProbability = this.calculateFailureProbability();
    }
    
    degradeCodeQuality(amount) {
        this.codeQuality = Math.max(0, this.codeQuality - amount);
        this.failureProbability = this.calculateFailureProbability();
    }
    
    checkForFailure() {
        // Random failure based on code quality and tech debt
        if (Math.random() > this.failureProbability) {
            return null;
        }
        // Generate a failure event
        const range = this.constants.get("maxSeverity") - this.constants.get("minSeverity");
        const severity = Math.random() * range + this.constants.get("minSeverity");
        return {
            severity: severity,
            impact: severity * 2, // Impact on product reputation
            description: this.generateFailureDescription(severity)
        };
    }
    
    generateFailureDescription(severity) {
        const descriptions = [
            'Database performance issues',
            'API timeout errors',
            'Security vulnerability discovered',
            'Critical bug in payment system',
            'Server outage',
            'Data corruption detected',
            'Authentication system failure',
            'Third-party integration breakdown',
            'Memory leak causing crashes',
            'Configuration error in production'
        ];

        const severityLevel = severity > this.constants.get("maxSeverity")*0.8 ? 'Critical' : 
            severity > this.constants.get("maxSeverity")*0.5 ? 'Major' : 'Minor';
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        return `${severityLevel}: ${description}`;
    }
    
    step() {
        // Natural code quality degradation over time
        this.degradeCodeQuality(this.constants.get("codeQualityDecayRate"));

        // Update maintenance cost based on code quality
        this.maintenanceCost = (100 - this.codeQuality) * this.constants.get("maintenanceCostFactor"); // Cost in dollars
    }
    
    getMetrics() {
        return {
            codeQuality: Math.round(this.codeQuality * 100) / 100,
            failureProbability: Math.round(this.failureProbability * 10000) / 100, // As percentage, $.2f%
            maintenanceCost: Math.round(this.maintenanceCost),
            recentFeaturesCount: this.recentFeatureLaunches.length
        };
    }
}