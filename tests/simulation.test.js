const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');

const files = [
  'js/constants.js',
  'js/project.js',
  'js/developer.js',
  'js/team.js',
  'js/codebase.js',
  'js/product.js',
  'js/lead.js',
  'js/simulation.js',
];

const source = `${files.map((file) => fs.readFileSync(file, 'utf8')).join('\n')}
this.Constants = Constants;
this.Developer = Developer;
this.EngineeringTeam = EngineeringTeam;
this.Product = Product;
this.Codebase = Codebase;
this.Lead = Lead;
this.Project = Project;
this.PROJECT_TYPE = PROJECT_TYPE;
this.Simulation = Simulation;
`;
const context = { console };
vm.runInNewContext(source, context);

const first = new context.Simulation({ seed: 123 });
const second = new context.Simulation({ seed: 123 });

assert.deepStrictEqual(
  first.engineeringTeam.developers.map((developer) => ({
    id: developer.id,
    name: developer.name,
    baseSkill: developer.baseSkill,
    codeKnowledge: developer.codeKnowledge,
    techDebtTolerance: developer.techDebtTolerance,
  })),
  second.engineeringTeam.developers.map((developer) => ({
    id: developer.id,
    name: developer.name,
    baseSkill: developer.baseSkill,
    codeKnowledge: developer.codeKnowledge,
    techDebtTolerance: developer.techDebtTolerance,
  })),
);

assert.deepStrictEqual(
  first.engineeringTeam.ideaQueue.map((project) => ({
    id: project.id,
    name: project.name,
    effort: project.estimatedEffort,
  })),
  second.engineeringTeam.ideaQueue.map((project) => ({
    id: project.id,
    name: project.name,
    effort: project.estimatedEffort,
  })),
);

const constants = new context.Constants();
constants.setSeed(7);

const teamWithLead = new context.EngineeringTeam(0, constants);
constants.set('projectSuggestionChance', 1);
teamWithLead.setLeads([{}]);
teamWithLead.addFeatureProject(10);
teamWithLead.step();
assert.strictEqual(teamWithLead.ideaQueue.length, 1);
assert.strictEqual(teamWithLead.todoList.length, 0);

const teamWithoutLead = new context.EngineeringTeam(0, constants);
constants.set('projectSuggestionChance', 1);
teamWithoutLead.setLeads([]);
teamWithoutLead.addFeatureProject(10);
teamWithoutLead.step();
assert.strictEqual(teamWithoutLead.ideaQueue.length, 0);
assert.strictEqual(teamWithoutLead.todoList.length, 1);

const resetSimulation = new context.Simulation({ seed: 99 });
resetSimulation.runStep();
resetSimulation.reset();
assert.strictEqual(resetSimulation.step, 0);
resetSimulation.runStep();
assert.strictEqual(resetSimulation.step, 1);
assert.strictEqual(resetSimulation.stats.history.length, 1);

const product = new context.Product(1000, new context.Constants());
assert.strictEqual(product.getMetrics().churnRate, 0.1);
assert(!Number.isNaN(product.getMetrics().churnRate));

const developer = new context.Developer('Test Dev', 50, 80, new context.Constants());
const startingSatisfaction = developer.satisfaction;
const startingBurnout = developer.burnoutLevel;
developer.updateSatisfaction({ workload: 1, recentFailures: 1, codebaseQuality: 10, teamSize: 1 });
assert(developer.satisfaction < startingSatisfaction);
assert(developer.burnoutLevel > startingBurnout);

const balancedSimulation = new context.Simulation({ seed: 123 });
const originalConsoleLog = console.log;
console.log = () => {};
try {
  for (let i = 0; i < 300; i++) {
    balancedSimulation.runStep();
  }
} finally {
  console.log = originalConsoleLog;
}
const balancedMetrics = balancedSimulation.getCurrentMetrics();
assert(balancedMetrics.product.userCount > 500);
assert(balancedMetrics.product.userCount < 10000);
assert(balancedMetrics.codebase.codeQuality > 40);
assert(balancedMetrics.team.developerCount > 0);

const featureImpactConstants = new context.Constants();
featureImpactConstants.setSeed(13);
const codebase = new context.Codebase(80, featureImpactConstants);
const completedFeatureA = new context.Project(context.PROJECT_TYPE.FEATURE, 10, 'Completed Feature A', featureImpactConstants);
const completedFeatureB = new context.Project(context.PROJECT_TYPE.FEATURE, 10, 'Completed Feature B', featureImpactConstants);
codebase.addFeatureLaunch(completedFeatureA).hasImpactedReputation = true;
codebase.addFeatureLaunch(completedFeatureB).hasImpactedReputation = true;
codebase.addFeatureLaunch(new context.Project(context.PROJECT_TYPE.FEATURE, 10, 'New Feature', featureImpactConstants));
assert.strictEqual(codebase.getReputationImpactFromFeatures(), 10);

const cappedProduct = new context.Product(7999999990, new context.Constants());
cappedProduct.reputation = 100;
cappedProduct.updateUserCount();
assert.strictEqual(cappedProduct.userCount, cappedProduct.constants.get('maxUserCount'));
assert.strictEqual(cappedProduct.getMetrics().maxUserCount, 8000000000);

const leadConstants = new context.Constants();
leadConstants.setSeed(23);
const featureProject = new context.Project(context.PROJECT_TYPE.FEATURE, 16, 'Customer Feature', leadConstants);
featureProject.estimatedEffort = 10;
const debtProject = new context.Project(context.PROJECT_TYPE.TECH_DEBT, 16, 'Debt Cleanup', leadConstants);
debtProject.estimatedEffort = 10;

const featureLead = new context.Lead('Feature Lead', 80, leadConstants);
featureLead.projectPreferences = { featureWeight: 0.9, techDebtWeight: 0.1 };
featureLead.decisionMaking = { riskTolerance: 80, timeHorizon: 'short' };
assert.strictEqual(featureLead.reviewProject(featureProject).approved, true);
assert.strictEqual(featureLead.reviewProject(debtProject).approved, false);
assert.strictEqual(featureLead.prioritizeProjects([debtProject, featureProject])[0], featureProject);

const debtLead = new context.Lead('Debt Lead', 80, leadConstants);
debtLead.projectPreferences = { featureWeight: 0.1, techDebtWeight: 0.9 };
debtLead.decisionMaking = { riskTolerance: 60, timeHorizon: 'long' };
assert.strictEqual(debtLead.reviewProject(debtProject).approved, true);
assert.strictEqual(debtLead.reviewProject(featureProject).approved, false);
assert.strictEqual(debtLead.prioritizeProjects([featureProject, debtProject])[0], debtProject);
assert.strictEqual(
  debtLead.makeStrategicDecision([
    { name: 'Ship feature', type: context.PROJECT_TYPE.FEATURE, impactValue: 16, risk: 30 },
    { name: 'Pay down debt', type: context.PROJECT_TYPE.TECH_DEBT, impactValue: 16, risk: 10 },
  ]).name,
  'Pay down debt',
);

const reviewedTeam = new context.EngineeringTeam(0, leadConstants);
reviewedTeam.setLeads([debtLead]);
reviewedTeam.addProject(featureProject);
reviewedTeam.addProject(debtProject);
reviewedTeam.step();
assert.strictEqual(reviewedTeam.todoList[0], debtProject);
assert.strictEqual(reviewedTeam.ideaQueue[0], featureProject);

console.log('simulation tests passed');
