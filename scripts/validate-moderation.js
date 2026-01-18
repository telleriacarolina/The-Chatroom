#!/usr/bin/env node
/**
 * Moderation System Validation Script
 * 
 * This script validates that the moderation system is properly set up:
 * - Checks that all required files exist
 * - Validates database schema has required fields
 * - Verifies API routes are registered
 * - Confirms background jobs are configured
 */

const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${description}`, colors.green);
    return true;
  } else {
    log(`✗ ${description} - File not found: ${filePath}`, colors.red);
    return false;
  }
}

function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(searchString)) {
      log(`✓ ${description}`, colors.green);
      return true;
    } else {
      log(`✗ ${description} - String not found: ${searchString}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`✗ ${description} - Error reading file: ${error.message}`, colors.red);
    return false;
  }
}

console.log('\n' + '='.repeat(60));
log('Moderation System Validation', colors.blue);
console.log('='.repeat(60) + '\n');

let allChecks = true;

// Check 1: Required files exist
log('Checking required files...', colors.yellow);
allChecks &= checkFile('packages/api/src/routes/moderation.js', 'Moderation routes file');
allChecks &= checkFile('packages/api/src/middleware/rbac.js', 'RBAC middleware file');
allChecks &= checkFile('packages/api/src/utils/audit.js', 'Audit utilities file');
allChecks &= checkFile('docs/MODERATION_SYSTEM.md', 'Moderation system documentation');
allChecks &= checkFile('docs/MODERATION_TESTING.md', 'Moderation testing guide');

console.log();

// Check 2: Schema has required models and fields
log('Checking database schema...', colors.yellow);
allChecks &= checkFileContent(
  'packages/api/prisma/schema.prisma',
  'model ModerationAppeal',
  'ModerationAppeal model exists'
);
allChecks &= checkFileContent(
  'packages/api/prisma/schema.prisma',
  'role',
  'User model has role field'
);
allChecks &= checkFileContent(
  'packages/api/prisma/schema.prisma',
  'isFlagged',
  'User model has isFlagged field'
);
allChecks &= checkFileContent(
  'packages/api/prisma/schema.prisma',
  'isBanned',
  'User model has isBanned field'
);
allChecks &= checkFileContent(
  'packages/api/prisma/schema.prisma',
  'isMuted',
  'User model has isMuted field'
);

console.log();

// Check 3: Routes are registered
log('Checking API server configuration...', colors.yellow);
allChecks &= checkFileContent(
  'packages/api/src/server.js',
  "require('./routes/moderation')",
  'Moderation routes imported in server'
);
allChecks &= checkFileContent(
  'packages/api/src/server.js',
  "app.use('/api/moderation'",
  'Moderation routes registered'
);

console.log();

// Check 4: Background jobs configured
log('Checking background jobs...', colors.yellow);
allChecks &= checkFileContent(
  'packages/api/src/services/backgroundJobs.js',
  'processExpiredBans',
  'processExpiredBans function exists'
);
allChecks &= checkFileContent(
  'packages/api/src/services/backgroundJobs.js',
  'processExpiredMutes',
  'processExpiredMutes function exists'
);
allChecks &= checkFileContent(
  'packages/api/src/services/backgroundJobs.js',
  'setInterval(processExpiredBans',
  'processExpiredBans scheduled as background job'
);
allChecks &= checkFileContent(
  'packages/api/src/services/backgroundJobs.js',
  'setInterval(processExpiredMutes',
  'processExpiredMutes scheduled as background job'
);

console.log();

// Check 5: Middleware functions exist
log('Checking middleware...', colors.yellow);
allChecks &= checkFileContent(
  'packages/api/src/middleware/rbac.js',
  'function requireRole',
  'requireRole middleware function exists'
);
allChecks &= checkFileContent(
  'packages/api/src/utils/audit.js',
  'function createAuditLog',
  'createAuditLog function exists'
);
allChecks &= checkFileContent(
  'packages/api/src/utils/audit.js',
  'function auditMiddleware',
  'auditMiddleware function exists'
);

console.log();

// Check 6: API endpoints exist
log('Checking API endpoints...', colors.yellow);
const endpoints = [
  ["router.post('/report'", 'POST /report endpoint'],
  ["router.post('/action'", 'POST /action endpoint'],
  ["router.get('/logs'", 'GET /logs endpoint'],
  ["router.get('/reports'", 'GET /reports endpoint'],
  ["router.post('/reports/:id/review'", 'POST /reports/:id/review endpoint'],
  ["router.post('/appeal'", 'POST /appeal endpoint'],
  ["router.get('/appeals'", 'GET /appeals endpoint'],
  ["router.post('/appeals/:id/review'", 'POST /appeals/:id/review endpoint'],
  ["router.get('/audit'", 'GET /audit endpoint']
];

endpoints.forEach(([searchString, description]) => {
  allChecks &= checkFileContent(
    'packages/api/src/routes/moderation.js',
    searchString,
    description
  );
});

console.log();

// Final result
console.log('='.repeat(60));
if (allChecks) {
  log('✓ All validation checks passed!', colors.green);
  log('\nThe moderation system is properly configured.', colors.green);
  log('Next steps:', colors.yellow);
  log('1. Run Prisma migrations: npm run prisma:migrate', colors.reset);
  log('2. Start the API server: npm run dev:api', colors.reset);
  log('3. Follow testing guide: docs/MODERATION_TESTING.md', colors.reset);
} else {
  log('✗ Some validation checks failed!', colors.red);
  log('\nPlease fix the issues above before proceeding.', colors.red);
  process.exit(1);
}
console.log('='.repeat(60) + '\n');
