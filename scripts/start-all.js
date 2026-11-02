const { spawn } = require('child_process');

const processes = [];
let shuttingDown = false;
let hasFailed = false;

const services = [
  { name: 'api', script: 'dev:api' },
  { name: 'socket', script: 'dev:socket' },
  { name: 'web', script: 'dev:web' }
];

function killAll() {
  for (const child of processes) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
}

function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  killAll();
  process.exit(exitCode);
}

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

for (const service of services) {
  const child = spawn(npmCommand(), ['run', service.script], {
    stdio: 'inherit',
    env: process.env
  });

  processes.push(child);

  child.on('error', (error) => {
    if (!hasFailed) {
      hasFailed = true;
      console.error(`Failed to start ${service.name}: ${error.message}`);
      shutdown(1);
    }
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      if (!hasFailed) {
        hasFailed = true;
        console.error(`${service.name} exited from signal ${signal}`);
      }
      shutdown(1);
      return;
    }

    if (code !== 0) {
      if (!hasFailed) {
        hasFailed = true;
        console.error(`${service.name} exited with code ${code}`);
      }
      shutdown(code || 1);
      return;
    }

    if (!hasFailed) {
      hasFailed = true;
      console.error(`${service.name} exited unexpectedly`);
      shutdown(1);
    }
  });
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(0));
});
