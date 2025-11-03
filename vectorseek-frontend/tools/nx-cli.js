#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const nxConfigPath = path.join(workspaceRoot, 'nx.json');

function loadNxConfig() {
  try {
    const raw = fs.readFileSync(nxConfigPath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Unable to read nx.json configuration:', error.message);
    process.exitCode = 1;
    return { projects: {} };
  }
}

function listProjects(projects) {
  return Object.keys(projects).sort();
}

function printGraph(projects) {
  const projectNames = listProjects(projects);
  if (!projectNames.length) {
    console.log('No projects registered in nx.json.');
    return;
  }
  console.log('Nx workspace graph (static mock):');
  projectNames.forEach((name) => {
    console.log(` • ${name}`);
  });
}

function runTests(projects, selection) {
  const projectNames = listProjects(projects);
  if (!projectNames.length) {
    console.warn('No projects available for testing.');
    return;
  }

  const requested = selection ? [selection] : projectNames;
  requested.forEach((project) => {
    if (!projects[project]) {
      console.warn(`Skipping unknown project '${project}'.`);
      return;
    }
    console.log(`Executing mock tests for ${project}...`);
    console.log(`✔ Completed mock tests for ${project}.`);
  });
}

function showHelp() {
  console.log('Usage: nx <command> [project]');
  console.log('Commands:');
  console.log('  graph        Displays a static project graph summary.');
  console.log('  test [proj]  Runs mock tests for a project or all projects.');
}

function main() {
  const [, , command, selection] = process.argv;
  const nxConfig = loadNxConfig();
  const projects = nxConfig.projects || {};

  switch (command) {
    case 'graph':
      printGraph(projects);
      break;
    case 'test':
      runTests(projects, selection);
      break;
    case undefined:
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.error(`Unknown command '${command}'.`);
      showHelp();
      process.exitCode = 1;
  }
}

main();
