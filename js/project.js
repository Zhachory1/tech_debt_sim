/**
 * Project class - represents both feature projects and tech debt reduction projects
 */
class Project {
    constructor(type = 'feature', impactValue = 10, name = '', constants = null) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type; // 'feature' or 'tech_debt'
        this.impactValue = impactValue; // How much reputation gain (feature) or tech debt reduction (tech_debt)
        this.name = name || this.generateName();
        this.status = 'idea'; // 'idea', 'todo', 'in_progress', 'completed'
        this.assignedDeveloper = null;
        this.progress = 0; // 0 to 100
        this.estimatedEffort = this.calculateEffort();
        this.approved = false;
        this.createdAt = Date.now();
        this.hasAffectedReputation = false; // To ensure single reputation impact
        if (constants != null && constants instanceof Constants) {
            this.setConstants(constants);
        }
    }

    setConstants(constants) {
        if (constants instanceof Constants) {
            this.constants = constants;
        }

        this.constants.set("progressRateMultiplier", 1.0);
        this.constants.set("techDebtImpactOnProgress", 1.0);
        this.constants.set("knowledgeGainMultiplier", 1.0);
    }

    generateName() {
        const featureNames = [
            'User Authentication',
            'Payment Integration',
            'Mobile App',
            'Search Optimization',
            'Performance Dashboard',
            'API Enhancement',
            'Data Analytics',
            'Social Features',
            'Notification System',
            'Security Update'
        ];

        const techDebtNames = [
            'Database Optimization',
            'Code Refactoring',
            'Legacy System Update',
            'Test Coverage Improvement',
            'Documentation Update',
            'Performance Optimization',
            'Security Audit',
            'Dependency Updates',
            'Code Review Process',
            'Architecture Cleanup'
        ];

        const names = this.type === 'feature' ? featureNames : techDebtNames;
        return names[Math.floor(Math.random() * names.length)];
    }

    calculateEffort() {
        // Base effort calculation - can be modified based on project complexity
        const baseEffort = this.type === 'feature' ?
            this.impactValue * 2 + Math.random() * 20 :
            this.impactValue * 1.5 + Math.random() * 15;

        return Math.max(10, baseEffort);
    }

    moveToTodo() {
        if (this.status === 'idea') {
            this.status = 'todo';
            return true;
        }
        return false;
    }

    assignToDeveloper(developer) {
        if (this.status === 'todo' && !this.assignedDeveloper) {
            this.assignedDeveloper = developer;
            this.status = 'in_progress';
            return true;
        }
        return false;
    }

    updateProgress(developer) {
        if (this.status === 'in_progress' && this.assignedDeveloper === developer) {
            // Progress depends on developer's skill and code knowledge
            const progressRate = this.constants.get("progressRateMultiplier", 1.0) *
                (developer.baseSkill + developer.codeKnowledge) / 100;
            const techDebtImpact = this.constants.get("techDebtImpactOnProgress", 1.0) *
                Math.max(0.1, 1 - (developer.techDebtTolerance / 100));

            this.progress += progressRate * techDebtImpact * (1 + Math.random() * 0.5);

            if (this.progress >= 100) {
                this.complete();
                return true;
            }
        }
        return false;
    }

    complete() {
        this.status = 'completed';
        this.progress = 100;

        // Developer gains code knowledge from completing projects
        if (this.assignedDeveloper) {
            this.assignedDeveloper.gainCodeKnowledge(this.impactValue * this.constants.get("knowledgeGainMultiplier", 0.1));
        }
    }

    isApproved() {
        return this.approved;
    }

    approve() {
        this.approved = true;
        return this.moveToTodo();
    }

    getAge() {
        return Date.now() - this.createdAt;
    }
}