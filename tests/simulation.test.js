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

const product = new context.Product(1000, new context.Constants());
assert.strictEqual(product.getMetrics().churnRate, 0.1);
assert(!Number.isNaN(product.getMetrics().churnRate));

const developer = new context.Developer('Test Dev', 50, 80, new context.Constants());
const startingSatisfaction = developer.satisfaction;
const startingBurnout = developer.burnoutLevel;
developer.updateSatisfaction({ workload: 1, recentFailures: 1, codebaseQuality: 10, teamSize: 1 });
assert(developer.satisfaction < startingSatisfaction);
assert(developer.burnoutLevel > startingBurnout);

console.log('simulation tests passed');
