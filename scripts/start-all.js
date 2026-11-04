const fs = require('fs');
const { spawn } = require('child_process');

const SHUTDOWN_TIMEOUT_MS = 4000;
const FORCE_KILL_TIMEOUT_MS = 1500;

const services = getServices();
const children = [];
let shuttingDown = false;
let exitCode = 0;

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function getServices() {
  if (!process.env.START_ALL_SERVICE_COMMANDS) {
    return [
      { name: 'api', command: npmCommand(), args: ['run', 'dev:api'] },
      { name: 'socket', command: npmCommand(), args: ['run', 'dev:socket'] },
      { name: 'web', command: npmCommand(), args: ['run', 'dev:web'] }
    ];
  }

  try {
    const parsed = JSON.parse(process.env.START_ALL_SERVICE_COMMANDS);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('START_ALL_SERVICE_COMMANDS must be a non-empty array');
    }

    return parsed.map((item, index) => {
      if (!item || typeof item.command !== 'string' || !Array.isArray(item.args)) {
        throw new Error(`Invalid service config at index ${index}`);
      }

      return {
        name: item.name || `service-${index + 1}`,
        command: item.command,
        args: item.args
      };
    });
  } catch (error) {
    console.error(`Invalid START_ALL_SERVICE_COMMANDS: ${error.message}`);
    process.exit(1);
  }
}

function toExitCode(signal) {
  if (signal === 'SIGINT') return 130;
  if (signal === 'SIGTERM') return 143;
  return 1;
}

function pidIsAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function killPidTree(pid, signal = 'SIGTERM') {
  if (!pidIsAlive(pid)) return;

  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const taskkill = spawn('taskkill', ['/pid', String(pid), '/t', '/f'], { stdio: 'ignore' });
      taskkill.on('error', resolve);
      taskkill.on('exit', resolve);
    });
    return;
  }

  try {
    process.kill(-pid, signal);
  } catch {
    try {
      process.kill(pid, signal);
    } catch {
      return;
    }
  }
}

function writePid(name, pid) {
  const file = process.env.START_ALL_PID_FILE;
  if (!file || !pid) return;
  fs.appendFileSync(file, `${name}:${pid}\n`);
}

async function stopChild(childRef) {
  if (!childRef || !childRef.child || childRef.exited) return;

  const pid = childRef.child.pid;

  await killPidTree(pid, 'SIGTERM');

  const gracefulExit = await Promise.race([
    childRef.exitPromise,
    delay(SHUTDOWN_TIMEOUT_MS)
  ]);

  if (!gracefulExit && pidIsAlive(pid)) {
    await killPidTree(pid, 'SIGKILL');
    await Promise.race([childRef.exitPromise, delay(FORCE_KILL_TIMEOUT_MS)]);
  }
}

async function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;

  await Promise.all(children.map((childRef) => stopChild(childRef)));
  process.exit(code);
}

function spawnService(service) {
  const child = spawn(service.command, service.args, {
    stdio: 'inherit',
    env: process.env,
    detached: process.platform !== 'win32'
  });

  const childRef = {
    name: service.name,
    child,
    exited: false
  };

  childRef.exitPromise = new Promise((resolve) => {
    child.once('exit', (code, signal) => {
      childRef.exited = true;
      resolve({ code, signal });
    });
  });

  children.push(childRef);
  writePid(service.name, child.pid);

  child.on('error', (error) => {
    if (exitCode === 0) {
      exitCode = 1;
      console.error(`Failed to start ${service.name}: ${error.message}`);
      void shutdown(exitCode);
    }
  });

  childRef.exitPromise.then(({ code, signal }) => {
    if (shuttingDown) return;

    if (signal) {
      if (exitCode === 0) exitCode = toExitCode(signal);
      console.error(`${service.name} exited from signal ${signal}`);
      void shutdown(exitCode);
      return;
    }

    if (code !== 0) {
      if (exitCode === 0) exitCode = code || 1;
      console.error(`${service.name} exited with code ${code}`);
      void shutdown(exitCode);
      return;
    }

    if (exitCode === 0) {
      exitCode = 1;
      console.error(`${service.name} exited unexpectedly`);
      void shutdown(exitCode);
    }
  });
}

process.on('SIGINT', () => {
  if (exitCode === 0) exitCode = 130;
  void shutdown(exitCode);
});

process.on('SIGTERM', () => {
  if (exitCode === 0) exitCode = 143;
  void shutdown(exitCode);
});

for (const service of services) {
  spawnService(service);
}
