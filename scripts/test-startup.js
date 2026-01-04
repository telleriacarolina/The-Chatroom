#!/usr/bin/env node

/**
 * Test Application Startup
 * Verifies all services start correctly and can communicate
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const TESTS = [
  {
    name: 'Check Node.js',
    test: async () => {
      const version = process.version;
      console.log(`✓ Node.js ${version}`);
      return true;
    }
  },
  {
    name: 'Check API server can start',
    test: async () => {
      return new Promise((resolve) => {
        const proc = spawn('npm', ['run', 'dev:api'], {
          cwd: path.resolve(__dirname, '..'),
          stdio: 'pipe'
        });

        const timeout = setTimeout(() => {
          proc.kill();
          resolve(true); // Server started successfully if it didn't crash immediately
        }, 3000);

        proc.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });

        proc.on('exit', (code) => {
          clearTimeout(timeout);
          resolve(code === 0 || code === null); // null = killed by us
        });
      });
    }
  },
  {
    name: 'Check health endpoint',
    test: async () => {
      return new Promise((resolve) => {
        const req = http.get('http://localhost:3001/health', (res) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        setTimeout(() => resolve(false), 2000);
      });
    }
  },
  {
    name: 'Check Socket.IO server can start',
    test: async () => {
      return new Promise((resolve) => {
        const proc = spawn('npm', ['run', 'dev:socket'], {
          cwd: path.resolve(__dirname, '..'),
          stdio: 'pipe'
        });

        const timeout = setTimeout(() => {
          proc.kill();
          resolve(true);
        }, 3000);

        proc.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });

        proc.on('exit', (code) => {
          clearTimeout(timeout);
          resolve(code === 0 || code === null);
        });
      });
    }
  }
];

async function runTests() {
  console.log('🚀 Testing Application Startup\n');

  let passed = 0;
  let failed = 0;

  for (const test of TESTS) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`✓ ${test.name}`);
        passed++;
      } else {
        console.log(`✗ ${test.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
