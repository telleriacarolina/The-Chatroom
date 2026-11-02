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
  },
  {
    type: 'script',
    target: 'dev'
  },
  {
    type: 'script',
    target: 'dev:api'
  },
  {
    type: 'script',
    target: 'dev:socket'
  },
  {
    type: 'script',
    target: 'dev:web'
  },
  {
    type: 'script',
    target: 'prisma:generate'
  },
  {
    type: 'script',
    target: 'prisma:migrate'
  }
];

const failures = [];

const requiredWorkspaceScripts = {
  '@chatroom/api': ['dev', 'start'],
  '@chatroom/socket': ['dev', 'start'],
  '@chatroom/web': ['dev', 'build', 'start']
};

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

for (const [workspace, scripts] of Object.entries(requiredWorkspaceScripts)) {
  const workspacePkgPath = path.join(repoRoot, 'packages', workspace.split('/')[1], 'package.json');
  if (!fs.existsSync(workspacePkgPath)) {
    failures.push(`Missing workspace package.json: packages/${workspace.split('/')[1]}/package.json`);
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

if (failures.length > 0) {
  console.error('Startup checks failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Startup checks passed.');
