const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const startAllPath = path.join(repoRoot, 'scripts/start-all.js');

const failures = [];

const checks = [
  { type: 'file', target: 'packages/api/src/server.js' },
  { type: 'file', target: 'packages/socket/src/socket-server.js' },
  { type: 'file', target: 'packages/api/prisma/schema.prisma' },
  { type: 'file', target: 'scripts/start-all.js' },
  { type: 'script', target: 'build' },
  { type: 'script', target: 'build:api' },
  { type: 'script', target: 'build:socket' },
  { type: 'script', target: 'build:web' },
  { type: 'script', target: 'dev' },
  { type: 'script', target: 'dev:api' },
  { type: 'script', target: 'dev:socket' },
  { type: 'script', target: 'dev:web' },
  { type: 'script', target: 'prisma:generate' },
  { type: 'script', target: 'prisma:migrate' }
];

const requiredWorkspaceScripts = {
  '@chatroom/api': ['dev', 'start', 'build'],
  '@chatroom/socket': ['dev', 'start', 'build'],
  '@chatroom/web': ['dev', 'build', 'start']
};

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

function makeTempFile(name) {
  return path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'chatroom-startup-test-')),
    name
  );
}

async function runManagedProcess({ serviceCommands, expectedExitCode, signalAfterMs, timeoutMs }) {
  const pidFile = makeTempFile('pids.txt');
  const child = spawn(process.execPath, [startAllPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      START_ALL_SERVICE_COMMANDS: JSON.stringify(serviceCommands),
      START_ALL_PID_FILE: pidFile
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let combinedOutput = '';
  child.stdout.on('data', (chunk) => {
    combinedOutput += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    combinedOutput += chunk.toString();
  });

  if (signalAfterMs) {
    setTimeout(() => {
      if (pidIsAlive(child.pid)) {
        child.kill('SIGTERM');
      }
    }, signalAfterMs);
  }

  const exitResult = await Promise.race([
    new Promise((resolve) => {
      child.on('exit', (code, signal) => resolve({ code, signal, timedOut: false }));
    }),
    delay(timeoutMs).then(() => ({ code: null, signal: null, timedOut: true }))
  ]);

  if (exitResult.timedOut) {
    child.kill('SIGTERM');
    await Promise.race([
      new Promise((resolve) => child.on('exit', resolve)),
      delay(3000)
    ]);
  }

  const observedExitCode = exitResult.code !== null ? exitResult.code : 143;
  if (observedExitCode !== expectedExitCode) {
    failures.push(`Expected exit code ${expectedExitCode}, got ${observedExitCode}. Output: ${combinedOutput.trim()}`);
  }

  await delay(400);
  const pidEntries = fs.existsSync(pidFile)
    ? fs.readFileSync(pidFile, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    : [];

  for (const entry of pidEntries) {
    const [, pidText] = entry.split(':');
    const pid = Number(pidText);
    if (pidIsAlive(pid)) {
      failures.push(`Orphaned child process detected for ${entry}`);
    }
  }
}

function runStaticChecks() {
  for (const check of checks) {
    if (check.type === 'file') {
      const fullPath = path.join(repoRoot, check.target);
      if (!fs.existsSync(fullPath)) {
        failures.push(`Missing file: ${check.target}`);
      }
      continue;
    }

    if (!packageJson.scripts?.[check.target]) {
      failures.push(`Missing npm script: ${check.target}`);
    }
  }

  for (const [workspace, scripts] of Object.entries(requiredWorkspaceScripts)) {
    const workspaceName = workspace.split('/')[1];
    const workspacePkgPath = path.join(repoRoot, 'packages', workspaceName, 'package.json');
    if (!fs.existsSync(workspacePkgPath)) {
      failures.push(`Missing workspace package.json: packages/${workspaceName}/package.json`);
      continue;
    }

    const workspacePkg = JSON.parse(fs.readFileSync(workspacePkgPath, 'utf8'));
    for (const scriptName of scripts) {
      if (!workspacePkg.scripts?.[scriptName]) {
        failures.push(`Missing ${scriptName} script in workspace ${workspace}`);
      }
    }
  }

  for (const scriptName of ['prisma:generate', 'prisma:migrate']) {
    const scriptValue = packageJson.scripts?.[scriptName];
    if (!scriptValue || !scriptValue.includes('--schema packages/api/prisma/schema.prisma')) {
      failures.push(`${scriptName} must include --schema packages/api/prisma/schema.prisma`);
    }
  }

  const buildScript = packageJson.scripts?.build || '';
  for (const requiredBuildScript of ['build:api', 'build:socket', 'build:web']) {
    if (!buildScript.includes(requiredBuildScript)) {
      failures.push(`build must include ${requiredBuildScript}`);
    }
  }
}

async function runRuntimeChecks() {
  const longRunner = { command: process.execPath, args: ['-e', 'setInterval(() => {}, 1000);'] };
  const failFast = { command: process.execPath, args: ['-e', 'setTimeout(() => process.exit(7), 300);'] };
  const invalid = { command: 'definitely-not-a-real-command', args: [] };

  await runManagedProcess({
    serviceCommands: [
      { name: 'api', ...longRunner },
      { name: 'socket', ...failFast },
      { name: 'web', ...longRunner }
    ],
    expectedExitCode: 7,
    timeoutMs: 8000
  });

  await runManagedProcess({
    serviceCommands: [
      { name: 'api', ...longRunner },
      { name: 'socket', ...invalid },
      { name: 'web', ...longRunner }
    ],
    expectedExitCode: 1,
    timeoutMs: 8000
  });

  await runManagedProcess({
    serviceCommands: [
      { name: 'api', ...longRunner },
      { name: 'socket', ...longRunner },
      { name: 'web', ...longRunner }
    ],
    expectedExitCode: 143,
    signalAfterMs: 600,
    timeoutMs: 8000
  });

  await runManagedProcess({
    serviceCommands: [
      { name: 'api', ...longRunner },
      { name: 'socket', ...longRunner },
      { name: 'web', ...longRunner }
    ],
    expectedExitCode: 143,
    timeoutMs: 1500
  });
}

async function main() {
  runStaticChecks();
  await runRuntimeChecks();

  if (failures.length > 0) {
    console.error('Startup checks failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Startup checks passed.');
}

main().catch((error) => {
  console.error(`Startup checks crashed: ${error.message}`);
  process.exit(1);
});
