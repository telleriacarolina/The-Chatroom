#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const defaultSchemaPath = path.join(__dirname, '..', 'packages', 'api', 'prisma', 'schema.prisma');
const prismaCliPath = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
const schemaPath = process.env.PRISMA_MIGRATION_TEST_SCHEMA_PATH || defaultSchemaPath;
const disposableDatabaseUrl = process.env.PRISMA_TEST_DATABASE_URL;
const activeDatabaseUrl = process.env.DATABASE_URL;

const parseDatabaseTarget = (databaseUrl) => {
  const parsed = new URL(databaseUrl);

  if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
    throw new Error('Database URL must use postgresql:// or postgres:// protocol.');
  }

  const schema = parsed.searchParams.get('schema');
  if (!schema) {
    throw new Error('PRISMA_TEST_DATABASE_URL must include a schema query parameter (for example, ?schema=chatroom_migration_test).');
  }

  if (schema === 'public') {
    throw new Error('PRISMA_TEST_DATABASE_URL schema cannot be "public". Use an isolated disposable schema.');
  }

  return {
    host: parsed.hostname.toLowerCase(),
    port: parsed.port || '5432',
    database: parsed.pathname.replace(/^\/+/, ''),
    schema
  };
};

if (!disposableDatabaseUrl) {
  console.error('Missing PRISMA_TEST_DATABASE_URL. Point it to a disposable PostgreSQL database.');
  process.exit(1);
}

let disposableTarget;
try {
  disposableTarget = parseDatabaseTarget(disposableDatabaseUrl);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (activeDatabaseUrl) {
  if (disposableDatabaseUrl === activeDatabaseUrl) {
    console.error('PRISMA_TEST_DATABASE_URL must not match DATABASE_URL.');
    process.exit(1);
  }

  try {
    const activeTarget = parseDatabaseTarget(activeDatabaseUrl);
    if (
      activeTarget.host === disposableTarget.host &&
      activeTarget.port === disposableTarget.port &&
      activeTarget.database === disposableTarget.database &&
      activeTarget.schema === disposableTarget.schema
    ) {
      console.error('PRISMA_TEST_DATABASE_URL resolves to the same database target as DATABASE_URL.');
      process.exit(1);
    }
  } catch (error) {
    console.warn(`Skipping DATABASE_URL target comparison: ${error.message}`);
  }
}

if (!schemaPath.endsWith('schema.prisma')) {
  console.error('PRISMA_MIGRATION_TEST_SCHEMA_PATH must point to a Prisma schema.prisma file.');
  process.exit(1);
}

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema file not found: ${schemaPath}`);
  process.exit(1);
}

if (!fs.existsSync(prismaCliPath)) {
  console.error('Local Prisma CLI not found. Run `npm install` before running migration validation.');
  process.exit(1);
}

const sharedEnv = {
  ...process.env,
  DATABASE_URL: disposableDatabaseUrl
};

delete sharedEnv.PRISMA_TEST_DATABASE_URL;

const run = (args) => {
  const result = spawnSync(process.execPath, [prismaCliPath, ...args, '--schema', schemaPath], {
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
