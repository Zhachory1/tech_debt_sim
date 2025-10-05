/**
 * Codebase class - represents the technical foundation of the product
 */
class Codebase {
    constructor(initialQuality = 80) {
        this.codeQuality = initialQuality; // 0-100 scale
        this.recentFeatureLaunches = []; // Array of features with launch dates
        this.techDebtLevel = 20; // 0-100 scale (inverse of quality)
        this.failureProbability = this.calculateFailureProbability();
        this.maintenanceCost = 0;
        this.featureLaunchImpactDecay = 0.8; // Each subsequent feature has less impact
    }
    
    calculateFailureProbability() {
        // Lower code quality = higher failure probability
        const qualityFactor = (100 - this.codeQuality) / 100;
        const techDebtFactor = this.techDebtLevel / 100;
        
        return Math.min(0.3, (qualityFactor * 0.2) + (techDebtFactor * 0.1));
    }
    
    addFeatureLaunch(project) {
        if (project.type === 'feature' && !project.hasAffectedReputation) {
            const launch = {
                projectId: project.id,
                name: project.name,
                impactValue: project.impactValue,
                launchDate: Date.now(),
                hasImpactedReputation: false
            };
            
            this.recentFeatureLaunches.push(launch);
            project.hasAffectedReputation = true;
            
            // Add tech debt based on developer's tolerance and rush
            const developer = project.assignedDeveloper;
            if (developer) {
                const techDebtAdded = Math.max(0, (100 - developer.techDebtTolerance) / 10);
                this.addTechDebt(techDebtAdded);
            }
            
            return launch;
        }
        return null;
    }
    
    getReputationImpactFromFeatures() {
        let totalImpact = 0;
        const currentTime = Date.now();
        const impactWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        
        // Clean up old features (older than impact window)
        this.recentFeatureLaunches = this.recentFeatureLaunches.filter(
            feature => (currentTime - feature.launchDate) < impactWindow
        );
        
        // Calculate diminishing returns for recent features
        this.recentFeatureLaunches.forEach((feature, index) => {
            if (!feature.hasImpactedReputation) {
                // Apply diminishing returns based on how many recent features there are
                const diminishingFactor = Math.pow(this.featureLaunchImpactDecay, index);
                const impact = feature.impactValue * diminishingFactor;
                totalImpact += impact;
                feature.hasImpactedReputation = true;
            }
        });
        
        return totalImpact;
    }
    
    processTechDebtReduction(project) {
        if (project.type === 'tech_debt') {
            const reduction = project.impactValue;
            this.reduceTechDebt(reduction);
            this.improveCodeQuality(reduction * 0.5);
            return reduction;
        }
        return 0;
    }
    
    addTechDebt(amount) {
        this.techDebtLevel = Math.min(100, this.techDebtLevel + amount);
        this.codeQuality = Math.max(0, this.codeQuality - (amount * 0.3));
        this.failureProbability = this.calculateFailureProbability();
    }
    
    reduceTechDebt(amount) {
        this.techDebtLevel = Math.max(0, this.techDebtLevel - amount);
        this.failureProbability = this.calculateFailureProbability();
    }
    
    improveCodeQuality(amount) {
        this.codeQuality = Math.min(100, this.codeQuality + amount);
        this.failureProbability = this.calculateFailureProbability();
    }
    
    degradeCodeQuality(amount) {
        this.codeQuality = Math.max(0, this.codeQuality - amount);
        this.techDebtLevel = Math.min(100, this.techDebtLevel + (amount * 0.5));
        this.failureProbability = this.calculateFailureProbability();
    }
    
    checkForFailure() {
        // Random failure based on code quality and tech debt
        if (Math.random() < this.failureProbability) {
            const severity = Math.random() * 10 + 5; // 5-15 severity
            return {
                severity: severity,
                impact: severity * 2, // Impact on product reputation
                description: this.generateFailureDescription(severity)
            };
        }
        return null;
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
        
        const severityLevel = severity > 12 ? 'Critical' : severity > 8 ? 'Major' : 'Minor';
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        return `${severityLevel}: ${description}`;
    }
    
    step() {
        // Natural code quality degradation over time
        this.degradeCodeQuality(0.1);
        
        // Update maintenance cost based on tech debt
        this.maintenanceCost = this.techDebtLevel * 100; // Cost in dollars
        
        // Clean up old feature launches
        this.getReputationImpactFromFeatures();
    }
    
    getMetrics() {
        return {
            codeQuality: Math.round(this.codeQuality * 100) / 100,
            techDebtLevel: Math.round(this.techDebtLevel * 100) / 100,
            failureProbability: Math.round(this.failureProbability * 10000) / 100, // As percentage
            maintenanceCost: Math.round(this.maintenanceCost),
            recentFeaturesCount: this.recentFeatureLaunches.length
        };
    }
}