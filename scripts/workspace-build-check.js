const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const workspaceName = process.argv[2];
const workspaceDir = process.argv[3];
const extensionsArg = process.argv[4] || '.js,.ts';
const tsconfigArg = process.argv[5];
const extensions = extensionsArg.split(',').map((ext) => ext.trim()).filter(Boolean);

if (!workspaceName || !workspaceDir) {
  console.error('Usage: node scripts/workspace-build-check.js <workspace-name> <workspace-dir> [extensions] [tsconfig]');
  process.exit(1);
}

const forcedFailure = process.env.FORCE_WORKSPACE_BUILD_FAIL;
if (forcedFailure && forcedFailure === workspaceName) {
  console.error(`Forced workspace build failure: ${workspaceName}`);
  process.exit(42);
}

const absoluteDir = path.resolve(process.cwd(), workspaceDir);

function collectFiles(dir, output = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectFiles(absolutePath, output);
      continue;
    }

    if (extensions.some((ext) => entry.name.endsWith(ext))) {
      output.push(absolutePath);
    }
  }

  return output;
}

if (!fs.existsSync(absoluteDir)) {
  console.error(`Workspace directory does not exist: ${workspaceDir}`);
  process.exit(1);
}

const files = collectFiles(absoluteDir).sort();

if (files.length === 0) {
  console.error(`No build-check files found in ${workspaceDir} for extensions: ${extensions.join(', ')}`);
  process.exit(1);
}

const jsFiles = files.filter((file) => file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs'));
const tsFiles = files.filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));

for (const file of jsFiles) {
  const check = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (check.status !== 0) {
    process.exit(check.status || 1);
  }
}

if (tsFiles.length > 0) {
  const tscBin = require.resolve('typescript/bin/tsc');
  const tscArgs = tsconfigArg
    ? ['-p', tsconfigArg, '--noEmit', '--pretty', 'false']
    : ['--noEmit', '--pretty', 'false', '--skipLibCheck', '--moduleResolution', 'node', '--target', 'ES2020', '--module', 'commonjs', ...tsFiles];

  const typecheck = spawnSync(process.execPath, [tscBin, ...tscArgs], { stdio: 'inherit' });
  if (typecheck.status !== 0) {
    process.exit(typecheck.status || 1);
  }
}

console.log(`Build checks passed for ${workspaceName} (${jsFiles.length} JS, ${tsFiles.length} TS files).`);
