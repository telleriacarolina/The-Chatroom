#!/usr/bin/env node
// Stub: surface tasks from TASKS.md; extend to generate structured outputs.
const fs = require('fs');
const path = require('path');

const tasksPath = path.resolve(__dirname, '..', 'TASKS.md');

function readTasks() {
  if (!fs.existsSync(tasksPath)) {
    console.log('No TASKS.md found next to this script.');
    return [];
  }
  const content = fs.readFileSync(tasksPath, 'utf8');
  return content.split(/\r?\n/).filter(Boolean);
}

(function main() {
  const tasks = readTasks();
  console.log('=== Tasks Overview (stub) ===');
  tasks.slice(0, 25).forEach((line, idx) => {
    console.log(`${idx + 1}. ${line}`);
  });
  if (tasks.length > 25) {
    console.log(`...and ${tasks.length - 25} more lines`);
  }
  console.log('\nTODO: enhance generateTasks.js to produce structured task lists.');
})();
