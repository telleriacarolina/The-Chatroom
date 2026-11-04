#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const dns = require('node:dns').promises;
const fs = require('node:fs');
const path = require('node:path');

const defaultSchemaPath = path.join(__dirname, '..', 'packages', 'api', 'prisma', 'schema.prisma');
const prismaCliPath = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
const migrationsDir = path.join(__dirname, '..', 'packages', 'api', 'prisma', 'migrations');
const schemaPath = process.env.PRISMA_MIGRATION_TEST_SCHEMA_PATH || defaultSchemaPath;
const disposableDatabaseUrl = process.env.PRISMA_TEST_DATABASE_URL;
const activeDatabaseUrl = process.env.DATABASE_URL;

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const parseDatabaseTarget = (databaseUrl, { requireSchema }) => {
  const parsed = new URL(databaseUrl);

  if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
    throw new Error('Database URL must use postgresql:// or postgres:// protocol.');
  }

  const schema = parsed.searchParams.get('schema') || 'public';
  if (requireSchema && !parsed.searchParams.get('schema')) {
    throw new Error('PRISMA_TEST_DATABASE_URL must include a schema query parameter (for example, ?schema=chatroom_migration_test).');
  }

  if (requireSchema && schema === 'public') {
    throw new Error('PRISMA_TEST_DATABASE_URL schema cannot be "public". Use an isolated disposable schema.');
  }

  if (!parsed.pathname || parsed.pathname === '/') {
    throw new Error('Database URL must include an explicit database name.');
  }

  const normalizedHost = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const normalizedPort = parsed.port || '5432';
  const normalizedDatabase = parsed.pathname.replace(/^\/+/, '');
  const normalizedSchema = schema.toLowerCase();

  return {
    host: normalizedHost,
    port: normalizedPort,
    database: normalizedDatabase,
    schema: normalizedSchema
  };
};

if (!disposableDatabaseUrl) {
  fail('Missing PRISMA_TEST_DATABASE_URL. Point it to a disposable PostgreSQL database.');
}

let disposableTarget;
try {
  disposableTarget = parseDatabaseTarget(disposableDatabaseUrl, { requireSchema: true });
} catch (error) {
  fail(error.message);
}

if (!/(test|tmp|sandbox|disposable|ci)/i.test(disposableTarget.schema)) {
  fail('PRISMA_TEST_DATABASE_URL schema must clearly indicate disposable use (include test/tmp/sandbox/disposable/ci).');
}

const resolveHostAddresses = async (hostname) => {
  try {
    const records = await dns.lookup(hostname, { all: true });
    return new Set(records.map((record) => record.address));
  } catch {
    return new Set();
  }
};

const isEquivalentTarget = async (left, right) => {
  if (left.port !== right.port || left.database !== right.database || left.schema !== right.schema) {
    return false;
  }

  if (left.host === right.host) {
    return true;
  }

  const [leftAddresses, rightAddresses] = await Promise.all([
    resolveHostAddresses(left.host),
    resolveHostAddresses(right.host)
  ]);

  if (leftAddresses.size === 0 || rightAddresses.size === 0) {
    return false;
  }

  for (const address of leftAddresses) {
    if (rightAddresses.has(address)) {
      return true;
    }
  }

  return false;
};

const createUrlWithSchema = (databaseUrl, schema) => {
  const parsed = new URL(databaseUrl);
  parsed.searchParams.set('schema', schema);
  return parsed.toString();
};

const createPsqlUrl = (databaseUrl) => {
  const parsed = new URL(databaseUrl);
  parsed.searchParams.delete('schema');
  return parsed.toString();
};

const run = (args, envOverride) => {
  const result = spawnSync(process.execPath, [prismaCliPath, ...args, '--schema', schemaPath], {
    stdio: 'inherit',
    env: envOverride
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

const runSql = (databaseUrl, sql) => {
  const result = spawnSync('psql', [createPsqlUrl(databaseUrl), '-v', 'ON_ERROR_STOP=1', '-c', sql], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

if (!schemaPath.endsWith('schema.prisma')) {
  fail('PRISMA_MIGRATION_TEST_SCHEMA_PATH must point to a Prisma schema.prisma file.');
}

if (!fs.existsSync(schemaPath)) {
  fail(`Schema file not found: ${schemaPath}`);
}

if (!fs.existsSync(prismaCliPath)) {
  fail('Local Prisma CLI not found. Run `npm install` before running migration validation.');
}

const migrationDirectories = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (migrationDirectories.length === 0) {
  fail('No migrations found to validate.');
}

const firstMigrationName = migrationDirectories[0];
const firstMigrationSqlPath = path.join(migrationsDir, firstMigrationName, 'migration.sql');

if (!fs.existsSync(firstMigrationSqlPath)) {
  fail(`First migration SQL not found: ${firstMigrationSqlPath}`);
}

const runForSchema = (schema, commands) => {
  const schemaDatabaseUrl = createUrlWithSchema(disposableDatabaseUrl, schema);
  const env = {
    ...process.env,
    DATABASE_URL: schemaDatabaseUrl
  };
  delete env.PRISMA_TEST_DATABASE_URL;

  runSql(schemaDatabaseUrl, `CREATE SCHEMA IF NOT EXISTS "${schema}"`);

  for (const args of commands) {
    run(args, env);
  }
};

const verifySentinel = (databaseUrl, schemaName) => {
  const result = spawnSync(
    'psql',
    [
      '-v',
      'ON_ERROR_STOP=1',
      createPsqlUrl(databaseUrl),
      '-tAc',
      `SELECT COUNT(*) FROM "${schemaName}"."User" WHERE id = 'migration-sentinel'`
    ],
    { encoding: 'utf8' }
  );
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
  if ((result.stdout || '').trim() !== '1') {
    fail('Upgrade migration check failed: sentinel row was not preserved.');
  }
};

const runValidation = async () => {
  if (activeDatabaseUrl) {
    if (disposableDatabaseUrl === activeDatabaseUrl) {
      fail('PRISMA_TEST_DATABASE_URL must not match DATABASE_URL.');
    }

    try {
      const activeTarget = parseDatabaseTarget(activeDatabaseUrl, { requireSchema: false });
      if (await isEquivalentTarget(activeTarget, disposableTarget)) {
        fail('PRISMA_TEST_DATABASE_URL resolves to the same database target as DATABASE_URL.');
      }
    } catch (error) {
      console.warn(`Skipping DATABASE_URL target comparison: ${error.message}`);
    }
  }

  const suffix = Date.now().toString(36);
  const baseSchema = disposableTarget.schema.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
  const freshSchema = `${baseSchema}_fresh_${suffix}`;
  const upgradeSchema = `${baseSchema}_upgrade_${suffix}`;

  runForSchema(freshSchema, [
    ['migrate', 'deploy'],
    ['migrate', 'status']
  ]);

  const upgradeDatabaseUrl = createUrlWithSchema(disposableDatabaseUrl, upgradeSchema);
  const upgradeEnv = {
    ...process.env,
    DATABASE_URL: upgradeDatabaseUrl
  };
  delete upgradeEnv.PRISMA_TEST_DATABASE_URL;

  runSql(upgradeDatabaseUrl, `CREATE SCHEMA IF NOT EXISTS "${upgradeSchema}"`);
  run(['db', 'execute', '--file', firstMigrationSqlPath], upgradeEnv);
  run(['migrate', 'resolve', '--applied', firstMigrationName], upgradeEnv);
  runSql(
    upgradeDatabaseUrl,
    `INSERT INTO "${upgradeSchema}"."User" ("id", "accountType", "accountStatus", "updatedAt")
     VALUES ('migration-sentinel', 'REGISTERED', 'ACTIVE', NOW())`
  );
  run(['migrate', 'deploy'], upgradeEnv);
  verifySentinel(upgradeDatabaseUrl, upgradeSchema);
  run(['migrate', 'status'], upgradeEnv);

  console.log('Disposable migration test passed.');
};

runValidation().catch((error) => {
  fail(error.message);
});
