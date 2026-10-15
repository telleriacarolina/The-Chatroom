#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const schemaPath = path.join(__dirname, '..', 'packages', 'api', 'prisma', 'schema.prisma');
const disposableDatabaseUrl = process.env.PRISMA_TEST_DATABASE_URL;
const activeDatabaseUrl = process.env.DATABASE_URL;

if (!disposableDatabaseUrl) {
  console.error('Missing PRISMA_TEST_DATABASE_URL. Point it to a disposable PostgreSQL database.');
  process.exit(1);
}

if (activeDatabaseUrl && disposableDatabaseUrl === activeDatabaseUrl) {
  console.error('PRISMA_TEST_DATABASE_URL must not match DATABASE_URL.');
  process.exit(1);
}

const sharedEnv = {
  ...process.env,
  DATABASE_URL: disposableDatabaseUrl
};

const run = (args) => {
  const result = spawnSync('npx', ['prisma', ...args, '--schema', schemaPath], {
    stdio: 'inherit',
    env: sharedEnv
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

run(['migrate', 'reset', '--force', '--skip-generate', '--skip-seed']);
run(['migrate', 'status']);

console.log('Disposable migration test passed.');
