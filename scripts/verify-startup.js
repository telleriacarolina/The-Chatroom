#!/usr/bin/env node

/**
 * Verification script for The Chatroom application startup
 * Tests that all three servers (API, Socket, Web) start correctly
 */

const http = require('http');

// Color codes for terminal output
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

function checkEndpoint(url, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === expectedStatus) {
          resolve({ success: true, data, status: res.statusCode });
        } else {
          reject(new Error(`Expected status ${expectedStatus}, got ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function verifyStartup() {
  log('\n========================================', colors.blue);
  log('The Chatroom - Startup Verification', colors.blue);
  log('========================================\n', colors.blue);

  let allPassed = true;

  // Test 1: API Health Endpoint
  try {
    log('Testing API Server (port 3001)...', colors.yellow);
    const apiResult = await checkEndpoint('http://localhost:3001/health');
    const healthData = JSON.parse(apiResult.data);
    
    if (healthData.status === 'ok') {
      log('✓ API Health Check: PASSED', colors.green);
      log(`  Status: ${healthData.status}`, colors.reset);
      log(`  Timestamp: ${healthData.timestamp}`, colors.reset);
    } else {
      throw new Error('Health check returned non-ok status');
    }
  } catch (err) {
    log('✗ API Health Check: FAILED', colors.red);
    log(`  Error: ${err.message}`, colors.red);
    allPassed = false;
  }

  // Test 2: Socket.IO Server
  try {
    log('\nTesting Socket.IO Server (port 3002)...', colors.yellow);
    const socketResult = await checkEndpoint('http://localhost:3002/socket.io/?EIO=4&transport=polling');
    
    if (socketResult.data.includes('"sid"') && socketResult.data.includes('"upgrades"')) {
      log('✓ Socket.IO Server: PASSED', colors.green);
      log('  Socket.IO endpoint responding correctly', colors.reset);
    } else {
      throw new Error('Socket.IO endpoint returned unexpected response');
    }
  } catch (err) {
    log('✗ Socket.IO Server: FAILED', colors.red);
    log(`  Error: ${err.message}`, colors.red);
    allPassed = false;
  }

  // Test 3: Next.js Web Server
  try {
    log('\nTesting Next.js Web Server (port 3000)...', colors.yellow);
    const webResult = await checkEndpoint('http://localhost:3000');
    
    if (webResult.data.includes('Enter The Chatroom') || webResult.data.includes('The Chatroom')) {
      log('✓ Web Server: PASSED', colors.green);
      log('  Next.js application responding', colors.reset);
    } else {
      log('✓ Web Server: PASSED (with warning)', colors.yellow);
      log('  Server is running but page content differs from expected', colors.yellow);
    }
  } catch (err) {
    log('✗ Web Server: FAILED', colors.red);
    log(`  Error: ${err.message}`, colors.red);
    allPassed = false;
  }

  // Summary
  log('\n========================================', colors.blue);
  if (allPassed) {
    log('All Tests PASSED ✓', colors.green);
    log('========================================\n', colors.blue);
    process.exit(0);
  } else {
    log('Some Tests FAILED ✗', colors.red);
    log('========================================\n', colors.blue);
    log('\nTroubleshooting:', colors.yellow);
    log('1. Ensure all servers are running:', colors.reset);
    log('   - npm run dev:api', colors.reset);
    log('   - npm run dev:socket', colors.reset);
    log('   - npm run dev:web', colors.reset);
    log('2. Check environment variables are set', colors.reset);
    log('3. Verify PostgreSQL is running', colors.reset);
    process.exit(1);
  }
}

// Run verification
verifyStartup().catch((err) => {
  log('\nUnexpected error:', colors.red);
  log(err.message, colors.red);
  process.exit(1);
});
