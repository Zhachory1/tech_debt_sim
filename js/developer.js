/**
 * Developer class - represents individual developers on the engineering team
 */
class Developer {
    constructor(name = '', baseSkill = null, techDebtTolerance = null) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.name = name || this.generateName();
        this.baseSkill = baseSkill ?? (20 + Math.random() * 60); // 20-80 skill level
        this.codeKnowledge = 10 + Math.random() * 20; // Starts between 10-30, grows over time
        this.techDebtTolerance = techDebtTolerance ?? (20 + Math.random() * 60); // 20-80 tolerance
        this.satisfaction = 75 + Math.random() * 20; // Starts between 75-95
        this.currentProject = null;
        this.completedProjects = [];
        this.productivity = this.calculateProductivity();
        this.experienceGained = 0;
        this.burnoutLevel = 0; // 0-100, higher means more likely to leave
        this.timeWithCompany = 0; // Simulation steps
    }
    
    generateName() {
        const names = [
            'Alex Chen', 'Jordan Smith', 'Casey Johnson', 'Riley Davis',
            'Morgan Wilson', 'Taylor Brown', 'Avery Garcia', 'Quinn Martinez',
            'Sage Anderson', 'River Thompson', 'Dakota Lee', 'Skyler White',
            'Phoenix Clark', 'Rowan Lewis', 'Ember Rodriguez', 'Sage Walker'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    calculateProductivity() {
        // Productivity is based on base skill, code knowledge, and satisfaction
        const skillFactor = this.baseSkill / 100;
        const knowledgeFactor = Math.min(1, this.codeKnowledge / 100);
        const satisfactionFactor = this.satisfaction / 100;
        
        return (skillFactor * 0.4 + knowledgeFactor * 0.3 + satisfactionFactor * 0.3);
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
        const qualityFactor = Math.max(0.2, codebaseQuality / 100);
        const completed = this.currentProject.updateProgress(this);
        
        if (completed) {
            this.completeProject();
            return true;
        }
        
        // Update satisfaction based on tech debt vs tolerance
        if (codebaseQuality < this.techDebtTolerance) {
            this.satisfaction -= 0.5; // Frustrated by poor code quality
            this.burnoutLevel += 0.3;
        } else {
            this.satisfaction += 0.1; // Happy with good code quality
        }
        
        return false;
    }
    
    completeProject() {
        if (this.currentProject) {
            this.completedProjects.push(this.currentProject);
            this.gainExperience(this.currentProject.impactValue);
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
            this.baseSkill = Math.min(100, this.baseSkill + 2);
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
        this.satisfaction -= 0.1;
        
        // Apply various factors
        if (factors.workload > 1.5) {
            this.satisfaction -= 1;
            this.burnoutLevel += 0.5;
        }
        
        if (factors.teamSize < 2) {
            this.satisfaction -= 0.5; // Lonely developer
        }
        
        if (factors.recentFailures > 0) {
            this.satisfaction -= factors.recentFailures * 0.5;
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
            this.satisfaction += 0.05;
        }
        
        // Natural burnout recovery when not overworked
        if (this.burnoutLevel > 0) {
            this.burnoutLevel -= 0.1;
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