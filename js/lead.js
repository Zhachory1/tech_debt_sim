/**
 * Lead class - placeholder for lead functionality
 */
class Lead {
    constructor(name = '', experienceLevel = 50, constants = null) {
        this.setConstants(constants);
        this.id = this.constants.random().toString(36).substr(2, 9);
        this.name = name || this.generateName();
        this.experienceLevel = experienceLevel; // 0-100
        this.approvalAuthority = true;
        this.projectPreferences = {
            featureWeight: 0.6,
            techDebtWeight: 0.4
        };
        this.decisionMaking = {
            riskTolerance: 50, // 0-100
            timeHorizon: 'medium' // 'short', 'medium', 'long'
        };
    }

    setConstants(constants) {
        if (constants != null) {
            this.constants = constants;
        } else {
            this.constants = new Constants();
        }
    }
    
    generateName() {
        const names = [
            'Sarah Johnson', 'Mike Chen', 'Emily Rodriguez', 'David Kim',
            'Lisa Thompson', 'John Martinez', 'Angela Davis', 'Robert Lee',
            'Jennifer Wilson', 'Chris Anderson', 'Maria Garcia', 'Kevin Brown'
        ];
        return names[Math.floor(this.constants.random() * names.length)];
    }
    
    // Placeholder methods
    reviewProject(project) {
        // TODO: Implement lead approval logic here
        return { approved: false, feedback: "Lead review not yet implemented" };
    }
    
    makeStrategicDecision(options) {
        // TODO: Implement strategic decision making logic here
        return null;
    }
    
    prioritizeProjects(projects) {
        // TODO: Implement project prioritization logic here
        return projects;
    }
    
    // Basic utility methods you might want to use
    getApprovalProbability(project) {
        // Simple probability based on project type and lead preferences
        if (project.type === 'feature') {
            return this.projectPreferences.featureWeight * (this.experienceLevel / 100);
        } else {
            return this.projectPreferences.techDebtWeight * (this.experienceLevel / 100);
        }
    }
    
    step() {
        // TODO: Implement any per-step lead behavior here
        // This gets called every simulation step
    }
}