const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const checks = [
  {
    type: 'file',
    target: 'packages/api/src/server.js'
  },
  {
    type: 'file',
    target: 'packages/socket/src/socket-server.js'
  },
  {
    type: 'file',
    target: 'packages/api/prisma/schema.prisma'
  },
  {
    type: 'script',
    target: 'build:web'
  }
];

const failures = [];

for (const check of checks) {
  if (check.type === 'file') {
    const fullPath = path.join(repoRoot, check.target);
    if (!fs.existsSync(fullPath)) {
      failures.push(`Missing file: ${check.target}`);
    }
  }

  if (check.type === 'script') {
    if (!packageJson.scripts?.[check.target]) {
      failures.push(`Missing npm script: ${check.target}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Startup checks failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Startup checks passed.');
