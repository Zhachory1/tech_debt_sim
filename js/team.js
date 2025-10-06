/**
 * EngineeringTeam class - manages a collection of developers
 */
class EngineeringTeam {
    constructor(initialDeveloperCount = 3, constants = null) {
        this.developers = [];
        this.ideaQueue = [];
        this.todoList = [];
        this.completedProjects = [];
        this.setConstants(constants);

        // Create initial developers
        for (let i = 0; i < initialDeveloperCount; i++) {
            this.addDeveloper();
        }
    }

    setConstants(constants) {
        if (constants != null) {
            this.constants = constants;
        } else {
            this.constants = new Constants();
        }

        // Default constants for team management
        this.constants.set("baseSatisfaction", 70);
        this.constants.set("satisfactionDecay", 0.5);
        this.constants.set("workloadImpact", 20);
        this.constants.set("teamSizeImpact", 10);
        this.constants.set("leaveThreshold", 30);
        this.constants.set("projectSuggestionChance", 0.1);
    }

    addDeveloper(name = null, baseSkill = null, techDebtTolerance = null) {
        const developer = new Developer(name, baseSkill, techDebtTolerance, this.constants);
        this.developers.push(developer);
        return developer;
    }

    removeDeveloper(developerId) {
        const index = this.developers.findIndex(dev => dev.id === developerId);
        if (index !== -1) {
            const developer = this.developers[index];

            // If developer was working on a project, move it back to todo
            if (developer.currentProject) {
                developer.currentProject.status = 'todo';
                developer.currentProject.assignedDeveloper = null;
                developer.currentProject.progress = 0;
            }

            this.developers.splice(index, 1);
            return developer;
        }
        return null;
    }

    addProject(project) {
        if (project instanceof Project) {
            this.ideaQueue.push(project);
            return true;
        }
        return false;
    }

    addFeatureProject(impactValue = null) {
        const impact = impactValue || (5 + Math.random() * 15);
        const project = new Project('feature', impact);
        return this.addProject(project);
    }

    addTechDebtProject(impactValue = null) {
        const impact = impactValue || (5 + Math.random() * 10);
        const project = new Project('tech_debt', impact);
        return this.addProject(project);
    }

    approveProject(projectId) {
        const project = this.ideaQueue.find(p => p.id === projectId);
        if (project && !project.isApproved()) {
            project.approve();
            this.moveToTodo(project);
            return true;
        }
        return false;
    }

    moveToTodo(project) {
        const ideaIndex = this.ideaQueue.findIndex(p => p.id === project.id);
        if (ideaIndex !== -1 && project.status === 'todo') {
            this.ideaQueue.splice(ideaIndex, 1);
            this.todoList.push(project);
            return true;
        }
        return false;
    }

    assignProjects() {
        // Assign available developers to todo projects
        const availableDevelopers = this.developers.filter(dev => dev.isAvailable());
        const todoProjects = this.todoList.filter(project => !project.assignedDeveloper);

        for (let i = 0; i < Math.min(availableDevelopers.length, todoProjects.length); i++) {
            const developer = availableDevelopers[i];
            const project = todoProjects[i];

            if (developer.assignProject(project)) {
                // Move project from todo to in progress (handled by assignProject)
                const todoIndex = this.todoList.findIndex(p => p.id === project.id);
                if (todoIndex !== -1) {
                    this.todoList.splice(todoIndex, 1);
                }
            }
        }
    }

    workOnProjects(codebaseQuality) {
        const completedThisStep = [];

        // TODO(zhach): Handle tech debt impact and reputation reward on progress
        this.developers.forEach(developer => {
            if (developer.workOnProject(codebaseQuality)) {
                completedThisStep.push(developer.currentProject || developer.completedProjects[developer.completedProjects.length - 1]);
            }
        });

        // Move completed projects to completed list
        completedThisStep.forEach(project => {
            if (project && !this.completedProjects.includes(project)) {
                this.completedProjects.push(project);
            }
        });

        return completedThisStep;
    }

    generateSuggestions() {
        const suggestions = [];

        this.developers.forEach(developer => {
            const suggestion = developer.suggestNewProject(this.ideaQueue);
            if (suggestion) {
                suggestions.push(suggestion);
            }
        });

        return suggestions;
    }

    updateTeamSatisfaction(factors = {}) {
        const teamFactors = {
            ...factors,
            teamSize: this.developers.length,
            workload: this.getAverageWorkload()
        };

        this.developers.forEach(developer => {
            developer.updateSatisfaction(teamFactors);
        });

        // Handle developers leaving
        const leaving = this.developers.filter(dev => dev.shouldLeave());
        leaving.forEach(dev => {
            this.removeDeveloper(dev.id);
        });

        return leaving;
    }

    getAverageWorkload() {
        if (this.developers.length === 0) return 0;

        const busyDevelopers = this.developers.filter(dev => !dev.isAvailable()).length;
        return busyDevelopers / this.developers.length;
    }

    getAverageSatisfaction() {
        if (this.developers.length === 0) return 0;

        const totalSatisfaction = this.developers.reduce((sum, dev) => sum + dev.satisfaction, 0);
        return totalSatisfaction / this.developers.length;
    }

    getAverageSkill() {
        if (this.developers.length === 0) return 0;

        const totalSkill = this.developers.reduce((sum, dev) => sum + dev.getEffectiveSkill(), 0);
        return totalSkill / this.developers.length;
    }

    step() {
        // Update each developer
        this.developers.forEach(dev => dev.step());

        // Generate project suggestions
        this.generateSuggestions();

        // Auto-assign projects if no leads (mentioned in requirements)
        if (this.hasNoLeads()) {
            this.autoApproveProjects();
        }

        // Assign available projects
        this.assignProjects();
    }

    hasNoLeads() {
        // This will be used when Lead class is implemented
        // For now, assume no leads so projects auto-approve
        return true;
    }

    autoApproveProjects() {
        // Auto-approve projects when there are no leads
        const unapprovedProjects = this.ideaQueue.filter(p => !p.isApproved());
        unapprovedProjects.forEach(project => {
            if (Math.random() < this.constants.get("projectSuggestionChance")) { // 10% chance per step to auto-approve
                this.approveProject(project.id);
            }
        });
    }

    getMetrics() {
        return {
            developerCount: this.developers.length,
            ideaQueueLength: this.ideaQueue.length,
            todoListLength: this.todoList.length,
            completedProjectsCount: this.completedProjects.length,
            averageSatisfaction: this.getAverageSatisfaction(),
            averageSkill: this.getAverageSkill(),
            averageWorkload: this.getAverageWorkload()
        };
    }
}