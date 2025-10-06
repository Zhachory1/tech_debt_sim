/**
 * Developer class - represents individual developers on the engineering team
 */
class Developer {
    constructor(name = '', baseSkill = null, techDebtTolerance = null, constants = null) {
        this.setConstants(constants);
        this.id = Math.random().toString(36).substr(2, 9);
        this.name = name || this.generateName();
        this.baseSkill = baseSkill ?? (20 + Math.random() * 60); // 20-80 skill level
        this.codeKnowledge = 10 + Math.random() * 20; // Starts between 10-30, grows over time
        this.techDebtTolerance = techDebtTolerance ?? (20 + Math.random() * 60); // 20-80 tolerance
        this.currentProject = null;
        this.completedProjects = [];

        this.productivity = this.calculateProductivity();
        this.experienceGained = 0;

        this.satisfaction = 75 + Math.random() * 20; // Starts between 75-95
        this.burnoutLevel = 0; // 0-100, higher means more likely to leave
        this.timeWithCompany = 0; // Simulation steps
    }

    setConstants(constants) {
        if (constants != null) {
            this.constants = constants;
        } else {
            this.constants = new Constants();
        }

        // Default constants for developer management
        this.constants.set("satisfactionDecay", 0.5);
        this.constants.set("skillImpactOnProductivity", 0.4);
        this.constants.set("knowledgeImpactOnProductivity", 0.3);
        this.constants.set("satisfactionImpactOnProductivity", 0.3);
        this.constants.set("recentFailuresImpact", 0.5);
        this.constants.set("teamSizeImpactOnSatisfaction", 0.2);
        this.constants.set("recentFailuresImpactOnSatisfaction", 0.3);
        this.constants.set("workloadImpactOnSatisfaction", 0.3);
        this.constants.set("workloadImpactOnBurnout", 0.3);
        this.constants.set("techDebtImpactOnSatisfaction_Negative", 0.5);
        this.constants.set("techDebtImpactOnSatisfaction_Positive", 0.1);
        this.constants.set("techDebtImpactOnBurnout", 0.2);
        this.constants.set("knowledgeGainMultiplier", 0.5);
        this.constants.set("burnoutRecoveryRate", 0.1);
        this.constants.set("satisfactionRecoveryRate", 0.05);
    }

    generateName() {
        const names = [
            'Alex Chen', 'Jordan Smith', 'Casey Johnson', 'Riley Davis',
            'Morgan Wilson', 'Taylor Brown', 'Avery Garcia', 'Quinn Martinez',
            'Sage Anderson', 'River Thompson', 'Dakota Lee', 'Poop White',
            'Phoenix Clark', 'Rowan Lewis', 'Ember Rodriguez', 'Sage Walker'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    calculateProductivity() {
        // Productivity is based on base skill, code knowledge, and satisfaction
        const skillFactor = this.baseSkill / 100;
        const knowledgeFactor = Math.min(1, this.codeKnowledge / 100);
        const satisfactionFactor = this.satisfaction / 100;

        return (skillFactor * this.constants.get("skillImpactOnProductivity") + 
            knowledgeFactor * this.constants.get("knowledgeImpactOnProductivity") + 
            satisfactionFactor * this.constants.get("satisfactionImpactOnProductivity"));
    }

    assignProject(project) {
        if (!this.currentProject && project.status === 'todo') {
            this.currentProject = project;
            project.assignToDeveloper(this);
            return true;
        }
        return false;
    }

    workOnProject(codebaseQuality) {
        if (!this.currentProject) return false;

        // Work progress is affected by codebase quality
        const completed = this.currentProject.updateProgress(this);

        if (completed) {
            this.completeProject();
            return true;
        }

        // Update satisfaction based on tech debt vs tolerance
        if (codebaseQuality < this.techDebtTolerance) {
            this.satisfaction -= this.constants.get("techDebtImpactOnSatisfaction_Negative"); // Frustrated by poor code quality
            this.burnoutLevel += this.constants.get("techDebtImpactOnBurnout");
        } else {
            this.satisfaction += this.constants.get("techDebtImpactOnSatisfaction_Positive"); // Happy with good code quality
        }

        return false;
    }

    completeProject() {
        if (this.currentProject) {
            this.completedProjects.push(this.currentProject);
            this.gainExperience(this.currentProject.impactValue);
            this.gainCodeKnowledge(this.currentProject.impactValue * this.constants.get("knowledgeGainMultiplier"));ßß
            this.currentProject = null;
        }
    }

    gainCodeKnowledge(amount) {
        this.codeKnowledge = Math.min(100, this.codeKnowledge + amount);
        this.productivity = this.calculateProductivity();
    }

    gainExperience(amount) {
        this.experienceGained += amount;

        // Every 100 experience points, gain some base skill
        if (this.experienceGained >= 100) {
            this.baseSkill = Math.min(100, this.baseSkill + 1);
            this.experienceGained -= 100;
            this.productivity = this.calculateProductivity();
        }
    }

    suggestNewProject(ideaQueue) {
        // Higher code knowledge means more likely to suggest projects
        const suggestionChance = (this.codeKnowledge / 100) * 0.1; // 10% max chance per step

        if (Math.random() < suggestionChance) {
            const projectType = Math.random() < 0.7 ? 'feature' : 'tech_debt';
            const impact = 5 + Math.random() * 15;
            const newProject = new Project(projectType, impact);

            ideaQueue.push(newProject);
            return newProject;
        }

        return null;
    }

    updateSatisfaction(factors = {}) {
        // Base satisfaction decay
        this.satisfaction -= this.constants.get("satisfactionDecay");

        // Apply various factors
        if (factors.workload > this.constants.get("workloadImpact")) {
            this.satisfaction -= this.constants.get("workloadImpactOnSatisfaction");
            this.burnoutLevel += this.constants.get("workloadImpactOnBurnout");
        }

        if (factors.teamSize < 2) {
            this.satisfaction -= this.constants.get("teamSizeImpactOnSatisfaction"); // Lonely developer
        }

        if (factors.recentFailures > 0) {
            this.satisfaction -= factors.recentFailures * this.constants.get("recentFailuresImpactOnSatisfaction");
        }

        // Clamp values
        this.satisfaction = Math.max(0, Math.min(100, this.satisfaction));
        this.burnoutLevel = Math.max(0, Math.min(100, this.burnoutLevel));

        this.productivity = this.calculateProductivity();
    }

    shouldLeave() {
        // Probability of leaving based on satisfaction and burnout
        const leaveProbability = (100 - this.satisfaction) / 1000 + this.burnoutLevel / 2000;
        return Math.random() < leaveProbability;
    }

    step() {
        this.timeWithCompany++;

        // Natural satisfaction recovery
        if (this.satisfaction < 80) {
            this.satisfaction += this.constants.get("satisfactionRecoveryRate");
        }

        // Natural burnout recovery when not overworked
        if (this.burnoutLevel > 0) {
            this.burnoutLevel -= this.constants.get("burnoutRecoveryRate");
        }

        this.productivity = this.calculateProductivity();
    }

    getEffectiveSkill() {
        return this.baseSkill * this.productivity;
    }

    isAvailable() {
        return this.currentProject === null;
    }
}