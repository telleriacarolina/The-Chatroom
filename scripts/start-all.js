#!/usr/bin/env node
// Helper: list or launch dev processes for API, Socket, and Web apps.
const { spawn } = require('child_process');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const processes = [
  { label: 'api', command: 'npm', args: ['run', 'dev:api'] },
  { label: 'socket', command: 'npm', args: ['run', 'dev:socket'] },
  { label: 'web', command: 'npm', args: ['run', 'dev:web'] }
];

function printPlan() {
  console.log('Planned commands (run with --run to start):');
  processes.forEach(p => {
    console.log(`- ${p.label}: ${p.command} ${p.args.join(' ')}`);
  });
}

function startAll() {
  processes.forEach(p => {
    const child = spawn(p.command, p.args, { cwd: workspaceRoot, stdio: 'inherit' });
    child.on('exit', code => {
      console.log(`${p.label} exited with code ${code}`);
    });
  });
}

(function main() {
  const shouldRun = process.argv.includes('--run');
  if (!shouldRun) {
    printPlan();
    return;
  }
  console.log('Starting all services...');
  startAll();
})();
