/**
 * Lead class - reviews projects and makes strategic tradeoffs
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
    
    reviewProject(project) {
        if (!this.approvalAuthority) {
            return { approved: false, feedback: `${this.name} cannot approve projects.` };
        }

        const score = this.scoreProject(project);
        const threshold = 0.55 - (this.decisionMaking.riskTolerance / 1000);
        const approved = score >= threshold;
        const projectType = this.getProjectTypeName(project);
        const direction = approved ? 'Approved' : 'Rejected';

        return {
            approved,
            score,
            feedback: `${direction} ${projectType} project ${project.name}: score ${score.toFixed(2)} vs threshold ${threshold.toFixed(2)}.`
        };
    }
    
    makeStrategicDecision(options) {
        if (!Array.isArray(options) || options.length === 0) {
            return null;
        }

        return options
            .map((option, index) => ({ option, index, score: this.scoreStrategicOption(option) }))
            .sort((a, b) => b.score - a.score || a.index - b.index)[0].option;
    }
    
    prioritizeProjects(projects) {
        if (!Array.isArray(projects)) {
            return [];
        }

        return projects
            .map((project, index) => ({ project, index, score: this.scoreProject(project) }))
            .sort((a, b) => b.score - a.score || a.index - b.index)
            .map(item => item.project);
    }
    
    getApprovalProbability(project) {
        return Math.max(0, Math.min(1, this.scoreProject(project)));
    }

    scoreProject(project) {
        const typeScore = this.getProjectTypeWeight(project) * 0.6;
        const impactScore = Math.min(1, project.impactValue / 20) * 0.3;
        const effortPenalty = Math.min(0.3, (project.estimatedEffort || 0) / 200) * ((100 - this.decisionMaking.riskTolerance) / 100);
        const experienceBonus = (this.experienceLevel / 100) * 0.1;
        const horizonBonus = this.getHorizonBonus(project.type);

        return typeScore + impactScore + experienceBonus + horizonBonus - effortPenalty;
    }

    scoreStrategicOption(option) {
        const project = option.project || option;
        if (project.type && project.impactValue) {
            return this.scoreProject(project) - this.getRiskPenalty(option.risk || 0);
        }

        const value = option.value ?? option.utility ?? option.impact ?? 0;
        const normalizedValue = Math.min(1, value / 100) * 0.6;
        const horizonBonus = option.timeHorizon === this.decisionMaking.timeHorizon ? 0.2 : 0;
        const riskPenalty = this.getRiskPenalty(option.risk || 0);

        return normalizedValue + horizonBonus - riskPenalty;
    }

    getProjectTypeWeight(project) {
        if (project.type === PROJECT_TYPE.FEATURE) {
            return this.projectPreferences.featureWeight;
        }
        if (project.type === PROJECT_TYPE.TECH_DEBT) {
            return this.projectPreferences.techDebtWeight;
        }
        return (this.projectPreferences.featureWeight + this.projectPreferences.techDebtWeight) / 2;
    }

    getProjectTypeName(project) {
        if (project.type === PROJECT_TYPE.FEATURE) {
            return 'feature';
        }
        if (project.type === PROJECT_TYPE.TECH_DEBT) {
            return 'tech debt';
        }
        return 'infrastructure';
    }

    getHorizonBonus(projectType) {
        if (this.decisionMaking.timeHorizon === 'short') {
            return projectType === PROJECT_TYPE.FEATURE ? 0.15 : -0.05;
        }
        if (this.decisionMaking.timeHorizon === 'long') {
            return projectType === PROJECT_TYPE.TECH_DEBT ? 0.15 : -0.05;
        }
        return 0;
    }

    getRiskPenalty(risk) {
        return Math.max(0, risk - this.decisionMaking.riskTolerance) / 100;
    }
    
    step() {
    }
}
