#!/usr/bin/env node

const { spawn } = require('child_process');

const HEALTH_PORT = Number(process.env.SMOKE_TEST_PORT || 3101);
const HEALTH_URL = `http://127.0.0.1:${HEALTH_PORT}/health`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(HEALTH_URL);
      if (!response.ok) {
        await sleep(500);
        continue;
      }

      const body = await response.json();
      if (body && body.status === 'ok') {
        return;
      }
    } catch (error) {
      // Retry while server starts.
    }

    await sleep(500);
  }

  throw new Error(`Health check failed for ${HEALTH_URL}`);
}

async function main() {
  const server = spawn('node', ['api/server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(HEALTH_PORT)
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  server.stdout.on('data', (data) => {
    process.stdout.write(data.toString());
  });
  server.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
  });

  try {
    await waitForHealth();
    console.log(`✅ Startup smoke test passed: ${HEALTH_URL}`);
    process.exitCode = 0;
  } catch (error) {
    console.error(`❌ Startup smoke test failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    server.kill('SIGTERM');
  }
}

main();
